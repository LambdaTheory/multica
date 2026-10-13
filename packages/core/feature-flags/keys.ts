export const COMPOSIO_MCP_APPS_FLAG = "composio_mcp_apps";
export const PLUGINS_V1_FLAG = "plugins_v1";
export const BILLING_WORKSPACE_SUBSCRIPTIONS_FLAG =
  "billing_workspace_subscriptions";
/**
 * Deployment-level commercial master switch (`MULTICA_BILLING_ENABLED` on the
 * server). Off (or absent on older servers) hides every purchase surface and
 * suppresses billing API calls, regardless of the subscription flag.
 */
export const BILLING_ENABLED_FLAG = "billing_enabled";
