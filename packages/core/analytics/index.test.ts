import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock posthog-js before importing the module under test so the module's
// top-level `import posthog from "posthog-js"` resolves to the mock.
vi.mock("posthog-js", () => {
  const mock = {
    init: vi.fn(),
    register: vi.fn(),
    reset: vi.fn(),
    identify: vi.fn(),
    capture: vi.fn(),
    captureException: vi.fn(),
    opt_in_capturing: vi.fn(),
    opt_out_capturing: vi.fn(),
  };
  return { default: mock };
});

// Re-import per test so module-level `enabled` / `initialized` / cached
// super-props don't leak between cases.
async function loadModule() {
  vi.resetModules();
  const analytics = await import("./index");
  const posthog = (await import("posthog-js")).default as unknown as {
    init: ReturnType<typeof vi.fn>;
    register: ReturnType<typeof vi.fn>;
    reset: ReturnType<typeof vi.fn>;
    capture: ReturnType<typeof vi.fn>;
    captureException: ReturnType<typeof vi.fn>;
    identify: ReturnType<typeof vi.fn>;
    opt_in_capturing: ReturnType<typeof vi.fn>;
    opt_out_capturing: ReturnType<typeof vi.fn>;
  };
  posthog.init.mockClear();
  posthog.register.mockClear();
  posthog.reset.mockClear();
  posthog.capture.mockClear();
  posthog.captureException.mockClear();
  posthog.identify.mockClear();
  posthog.opt_in_capturing.mockClear();
  posthog.opt_out_capturing.mockClear();
  return { analytics, posthog };
}

beforeEach(() => {
  vi.stubGlobal("window", {});
  vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0" });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// Explicit opt-in — the host app must call setAnalyticsEnabled(true) (web:
// NEXT_PUBLIC_ANALYTICS_ENABLED, desktop: VITE_ANALYTICS_ENABLED) before any
// of the capture paths can run. Every test below that expects traffic opts in
// first; the default-disabled regressions live in their own describe.
describe("initAnalytics super-properties", () => {
  it("registers client_type and app_version after posthog.init", async () => {
    const { analytics, posthog } = await loadModule();
    analytics.setAnalyticsEnabled(true);
    analytics.initAnalytics({ key: "k", host: "", appVersion: "1.2.3" });
    expect(posthog.register).toHaveBeenCalledWith({
      client_type: "web",
      app_version: "1.2.3",
      environment: "dev",
      event_schema_version: 2,
      is_demo: false,
    });
  });

  it("omits app_version when not provided", async () => {
    const { analytics, posthog } = await loadModule();
    analytics.setAnalyticsEnabled(true);
    analytics.initAnalytics({ key: "k", host: "" });
    expect(posthog.register).toHaveBeenCalledWith({
      client_type: "web",
      environment: "dev",
      event_schema_version: 2,
      is_demo: false,
    });
  });

  it("detects desktop when window.electron is present", async () => {
    vi.stubGlobal("window", { electron: {} });
    const { analytics, posthog } = await loadModule();
    analytics.setAnalyticsEnabled(true);
    analytics.initAnalytics({ key: "k", host: "" });
    expect(posthog.register).toHaveBeenCalledWith({
      client_type: "desktop",
      environment: "dev",
      event_schema_version: 2,
      is_demo: false,
    });
  });
});

describe("default-off gate", () => {
  it("never initializes the SDK even when the backend advertises a key", async () => {
    const { analytics, posthog } = await loadModule();
    expect(analytics.initAnalytics({ key: "remote-key", host: "" })).toBe(
      false,
    );
    expect(posthog.init).not.toHaveBeenCalled();
    expect(posthog.register).not.toHaveBeenCalled();
  });

  it("captureEvent does not buffer before init and never sends", async () => {
    const { analytics, posthog } = await loadModule();
    analytics.captureEvent("step_transition", { step: 3 });
    // Enabling afterwards must not resurrect the dropped event.
    analytics.setAnalyticsEnabled(true);
    analytics.initAnalytics({ key: "k", host: "" });
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("identify is a hard no-op: nothing buffered, nothing sent on init", async () => {
    const { analytics, posthog } = await loadModule();
    analytics.identify("user-1", { email: "a@b.c" });
    analytics.setAnalyticsEnabled(true);
    analytics.initAnalytics({ key: "k", host: "" });
    expect(posthog.identify).not.toHaveBeenCalled();
  });

  it("captureException is dropped without buffering", async () => {
    const { analytics, posthog } = await loadModule();
    analytics.captureException(new Error("boom"));
    analytics.setAnalyticsEnabled(true);
    analytics.initAnalytics({ key: "k", host: "" });
    expect(posthog.captureException).not.toHaveBeenCalled();
  });

  it("captureSignupSource writes no attribution cookie when disabled", async () => {
    const { analytics } = await loadModule();
    vi.stubGlobal("document", { cookie: "" });
    try {
      Object.defineProperty(window, "location", {
        value: new URL("https://app.example.com/?utm_source=reddit"),
        writable: true,
      });
      analytics.captureSignupSource();
      expect(document.cookie).toBe("");
      // Even after enabling, the write happens at call time only — a later
      // opt-in must not retroactively stamp attribution for this page load.
      analytics.setAnalyticsEnabled(true);
      expect(document.cookie).toBe("");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe("setAnalyticsEnabled", () => {
  it("disabling after init drops pending entries and stops SDK collection", async () => {
    const { analytics, posthog } = await loadModule();
    analytics.setAnalyticsEnabled(true);
    analytics.initAnalytics({ key: "k", host: "" });

    // Buffer a pre-init... no — already initialized. Buffer via disable →
    // enable → capture before re-init is covered elsewhere; here verify the
    // disable path itself.
    analytics.setAnalyticsEnabled(false);
    expect(posthog.opt_out_capturing).toHaveBeenCalledTimes(1);

    // Capture after disable is a no-op even though the SDK is initialized.
    analytics.captureEvent("late_event");
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("disabling before init clears buffered pre-init entries", async () => {
    const { analytics, posthog } = await loadModule();
    analytics.setAnalyticsEnabled(true);
    analytics.captureEvent("queued_event");
    analytics.identify("user-1");

    analytics.setAnalyticsEnabled(false);
    analytics.setAnalyticsEnabled(true);
    analytics.initAnalytics({ key: "k", host: "" });

    // The buffered entries were dropped by the disable, not replayed.
    expect(posthog.capture).not.toHaveBeenCalled();
    expect(posthog.identify).not.toHaveBeenCalled();
  });

  it("re-enabling restores SDK collection on an initialized instance", async () => {
    const { analytics, posthog } = await loadModule();
    analytics.setAnalyticsEnabled(true);
    analytics.initAnalytics({ key: "k", host: "" });
    analytics.setAnalyticsEnabled(false);
    analytics.setAnalyticsEnabled(true);

    expect(posthog.opt_in_capturing).toHaveBeenCalledTimes(1);
    analytics.captureEvent("back_online");
    expect(posthog.capture).toHaveBeenCalledWith(
      "back_online",
      expect.any(Object),
      undefined,
    );
  });

  it("disabling on an uninitialized instance is a no-op on the SDK", async () => {
    const { analytics, posthog } = await loadModule();
    analytics.setAnalyticsEnabled(true);
    analytics.setAnalyticsEnabled(false);
    expect(posthog.opt_out_capturing).not.toHaveBeenCalled();
  });
});

describe("resetAnalytics", () => {
  it("re-registers super-properties after reset so subsequent events keep client_type", async () => {
    const { analytics, posthog } = await loadModule();
    analytics.setAnalyticsEnabled(true);
    analytics.initAnalytics({ key: "k", host: "", appVersion: "1.2.3" });
    posthog.register.mockClear();

    analytics.resetAnalytics();

    // reset() wipes persisted super-props; we re-register the cached set so
    // the next session's events keep client_type + app_version.
    expect(posthog.reset).toHaveBeenCalledTimes(1);
    expect(posthog.register).toHaveBeenCalledWith({
      client_type: "web",
      app_version: "1.2.3",
      environment: "dev",
      event_schema_version: 2,
      is_demo: false,
    });
  });

  it("is a no-op when analytics was never initialized", async () => {
    const { analytics, posthog } = await loadModule();
    analytics.setAnalyticsEnabled(true);
    analytics.resetAnalytics();
    expect(posthog.reset).not.toHaveBeenCalled();
    expect(posthog.register).not.toHaveBeenCalled();
  });
});

describe("captureException", () => {
  it("buffers a pre-init exception and flushes it on init", async () => {
    const { analytics, posthog } = await loadModule();
    const err = new Error("boom");
    analytics.setAnalyticsEnabled(true);

    // Before init: buffered, nothing sent yet.
    analytics.captureException(err, { source: "global-error" });
    expect(posthog.captureException).not.toHaveBeenCalled();

    // Init flushes the buffer in order.
    analytics.initAnalytics({ key: "k", host: "" });
    expect(posthog.captureException).toHaveBeenCalledTimes(1);
    expect(posthog.captureException).toHaveBeenCalledWith(
      err,
      expect.objectContaining({ source: "global-error" }),
    );
  });

  it("sends immediately once initialized", async () => {
    const { analytics, posthog } = await loadModule();
    analytics.setAnalyticsEnabled(true);
    analytics.initAnalytics({ key: "k", host: "" });
    posthog.captureException.mockClear();

    const err = new Error("later");
    analytics.captureException(err);
    expect(posthog.captureException).toHaveBeenCalledTimes(1);
    expect(posthog.captureException).toHaveBeenCalledWith(err, expect.any(Object));
  });
});

describe("before_send $exception pipeline", () => {
  // before_send is registered inside posthog.init's config; pull it back out of
  // the mock and drive it directly. Dedupe needs a working sessionStorage.
  function makeMemoryStorage() {
    const data = new Map<string, string>();
    return {
      getItem: (k: string) => (data.has(k) ? data.get(k)! : null),
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
      clear: () => data.clear(),
      key: (i: number) => Array.from(data.keys())[i] ?? null,
      get length() {
        return data.size;
      },
    };
  }

  type BeforeSend = (
    e: { event: string; properties: Record<string, unknown> } | null,
  ) => unknown;

  function getBeforeSend(posthog: { init: ReturnType<typeof vi.fn> }): BeforeSend {
    const config = posthog.init.mock.calls[0]?.[1] as { before_send: BeforeSend };
    return config.before_send;
  }

  function excEvent() {
    return {
      event: "$exception",
      properties: {
        $exception_list: [
          {
            type: "TypeError",
            value: "Bad email bob@corp.com",
            stacktrace: {
              frames: [{ filename: "a.tsx", function: "f", lineno: 1, colno: 2 }],
            },
          },
        ],
      },
    };
  }

  beforeEach(() => {
    vi.stubGlobal("sessionStorage", makeMemoryStorage());
  });

  it("redacts the message, then drops repeats past the per-fingerprint limit", async () => {
    const { analytics, posthog } = await loadModule();
    analytics.setAnalyticsEnabled(true);
    analytics.initAnalytics({ key: "k", host: "" });
    const beforeSend = getBeforeSend(posthog);

    const first = beforeSend(excEvent()) as { properties: { $exception_list: Array<{ value: string }> } };
    // Redaction still runs before the fuse.
    expect(first.properties.$exception_list[0]!.value).toBe("Bad email [redacted]");

    expect(beforeSend(excEvent())).not.toBeNull();
    expect(beforeSend(excEvent())).not.toBeNull();
    // 4th identical exception is dropped.
    expect(beforeSend(excEvent())).toBeNull();
  });

  it("passes non-$exception events through untouched", async () => {
    const { analytics, posthog } = await loadModule();
    analytics.setAnalyticsEnabled(true);
    analytics.initAnalytics({ key: "k", host: "" });
    const beforeSend = getBeforeSend(posthog);

    const evt = { event: "$pageview", properties: { $current_url: "/acme/issues" } };
    expect(beforeSend(evt)).toBe(evt);
  });
});
