import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { configStore } from "@multica/core/config";
import { BILLING_ENABLED_FLAG, BILLING_WORKSPACE_SUBSCRIPTIONS_FLAG } from "@multica/core/feature-flags";
import type { InboxItem } from "@multica/core/types";
import en from "../../locales/en/inbox.json";
import { AutopilotQuotaNotice } from "./autopilot-quota-notice";

vi.mock("../../i18n", () => ({
  useT: () => ({
    t: (accessor: (dict: unknown) => string, params?: Record<string, string>) => {
      const template = accessor(en);
      if (!params) return template;
      return template.replace(
        /\{\{(\w+)\}\}/g,
        (_, key: string) => params[key] ?? "",
      );
    },
  }),
}));

function item(overrides: Partial<InboxItem> = {}): InboxItem {
  return {
    id: "inbox-1",
    workspace_id: "workspace-1",
    recipient_type: "member",
    recipient_id: "member-1",
    actor_type: "system",
    actor_id: null,
    type: "autopilot_quota_exceeded",
    severity: "attention",
    issue_id: null,
    title: "Autopilot run limit reached",
    body: "Fallback body",
    issue_status: null,
    read: false,
    archived: false,
    created_at: "2026-08-28T08:00:00Z",
    details: {
      limit: "100",
      reset_at: "2026-09-01T00:00:00Z",
    },
    ...overrides,
  };
}

describe("AutopilotQuotaNotice", () => {
  beforeEach(() => {
    configStore.getState().setFeatureFlags({});
  });

  it("shows localized rejection facts and opens the shared recovery surface", () => {
    configStore.getState().setFeatureFlags({
      [BILLING_ENABLED_FLAG]: true,
      [BILLING_WORKSPACE_SUBSCRIPTIONS_FLAG]: true,
    });
    const onOpenRecovery = vi.fn();

    render(
      <AutopilotQuotaNotice
        item={item()}
        onOpenRecovery={onOpenRecovery}
      />,
    );

    expect(screen.getByText(/limit of 100 autopilot runs/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View upgrade options" }));
    expect(onOpenRecovery).toHaveBeenCalledOnce();
  });

  it("keeps the first blocked autopilot out of the workspace-level body", () => {
    configStore.getState().setFeatureFlags({
      [BILLING_ENABLED_FLAG]: true,
      [BILLING_WORKSPACE_SUBSCRIPTIONS_FLAG]: true,
    });
    render(
      <AutopilotQuotaNotice
        item={item({
          details: {
            limit: "100",
            reset_at: "2026-09-01T00:00:00Z",
            autopilot_title: "Daily triage",
          },
        })}
        onOpenRecovery={vi.fn()}
      />,
    );

    expect(screen.queryByText(/Daily triage/)).not.toBeInTheDocument();
    expect(screen.getByText(/limit of 100 autopilot runs/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View upgrade options" })).toBeInTheDocument();
  });

  // Regression: with the deployment master switch off there is nothing to
  // upgrade to, so the recovery entry point is withheld and the explanation
  // stays.
  it("withholds the upgrade button when billing is disabled", () => {
    const onOpenRecovery = vi.fn();

    render(<AutopilotQuotaNotice item={item()} onOpenRecovery={onOpenRecovery} />);

    expect(screen.getByText(/limit of 100 autopilot runs/)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View upgrade options" }),
    ).not.toBeInTheDocument();
  });
});
