// Package analytics ships product telemetry events to an external analytics
// backend (PostHog). Events feed the acquisition → activation → expansion
// funnel — see events.go for the event contract.
//
// Design:
//   - Capture is non-blocking. Request handlers must never wait on analytics
//     network I/O, so we enqueue into a bounded channel and a background
//     worker flushes to PostHog in batches.
//   - When the queue is full events are dropped (and counted). A broken
//     analytics backend must never degrade the product.
//   - Analytics is off by default: only ANALYTICS_DISABLED=false/0 combined
//     with a POSTHOG_API_KEY enables shipping. Everything else runs a no-op
//     client.
package analytics

import (
	"log/slog"
	"os"
	"strings"
	"time"
)

// Event is a single analytics capture. Fields mirror PostHog's /capture/ shape
// but are framework-agnostic so alternate backends can plug in later.
type Event struct {
	// Name of the event (e.g. "signup", "workspace_created").
	Name string

	// DistinctID identifies the person this event belongs to. For logged-in
	// users this is user.id; for anonymous events it should be the anon_id
	// that was previously used on the frontend so identity merging works.
	DistinctID string

	// WorkspaceID scopes the event to a workspace. Required when the event is
	// about a workspace-level action (workspace_created, issue_executed, ...).
	// Empty is allowed for pre-workspace events (signup).
	WorkspaceID string

	// Properties is the free-form bag of event attributes. Only serialisable
	// values (string, number, bool, nested maps/slices of the same) should
	// go here. Never put raw PII like full emails here — use email_domain.
	Properties map[string]any

	// SetOnce properties attach to the person record and are only written the
	// first time they appear. Use this for acquisition attribution
	// (initial_utm_source, etc.) so later events don't overwrite the origin.
	SetOnce map[string]any

	// Set properties attach to the person record and overwrite on every write.
	// Use this for mutable cohort signals (role, use_case, platform_preference)
	// that users can legitimately change during onboarding.
	Set map[string]any

	// Timestamp is optional; when zero the client fills in time.Now().
	Timestamp time.Time
}

// Client is the narrow surface the rest of the codebase depends on. Handlers
// call Capture and move on; the implementation is responsible for buffering,
// batching, and shipping.
type Client interface {
	Capture(e Event)
	// Close drains pending events. Call once during graceful shutdown.
	Close()
}

// NewFromEnv returns a Client configured from environment variables:
//
//   - ANALYTICS_DISABLED: analytics is off by default. Only an explicit
//     "false"/"0" opts the deployment in (see EnabledFromEnv).
//   - POSTHOG_API_KEY: project API key. Empty → no-op client, even when the
//     opt-in above is present.
//   - POSTHOG_HOST:    API host (default https://us.i.posthog.com).
//   - ANALYTICS_ENVIRONMENT: production/staging/dev. Defaults from APP_ENV.
//
// EnabledFromEnv is the single source of truth for the switch; /api/config
// shares it so the published PostHog key and the actual client never disagree.
func NewFromEnv() Client {
	if !EnabledFromEnv() {
		slog.Info("analytics disabled (default off; set ANALYTICS_DISABLED=false or 0 with POSTHOG_API_KEY to enable)")
		return NoopClient{}
	}
	key := os.Getenv("POSTHOG_API_KEY")
	host := os.Getenv("POSTHOG_HOST")
	if host == "" {
		host = "https://us.i.posthog.com"
	}
	slog.Info("analytics: posthog client enabled", "host", host)
	return NewPostHogClient(PostHogConfig{
		APIKey:      key,
		Host:        host,
		Environment: EnvironmentFromEnv(),
	})
}

// EnabledFromEnv reports whether product analytics may run: ANALYTICS_DISABLED
// must be explicitly "false" or "0" (case-insensitive, trimmed) AND
// POSTHOG_API_KEY must be set. Shared with the /api/config handler so it
// withholds the PostHog key on exactly the deployments where this client is a
// no-op.
func EnabledFromEnv() bool {
	key := os.Getenv("POSTHOG_API_KEY")
	if strings.TrimSpace(key) == "" {
		return false
	}
	switch strings.ToLower(strings.TrimSpace(os.Getenv("ANALYTICS_DISABLED"))) {
	case "false", "0":
		return true
	default:
		return false
	}
}

func EnvironmentFromEnv() string {
	if v := normalizeEnvironment(os.Getenv("ANALYTICS_ENVIRONMENT")); v != "" {
		return v
	}
	if v := normalizeEnvironment(os.Getenv("APP_ENV")); v != "" {
		return v
	}
	return "dev"
}

func normalizeEnvironment(v string) string {
	switch strings.ToLower(strings.TrimSpace(v)) {
	case "production", "prod":
		return "production"
	case "staging", "stage":
		return "staging"
	case "development", "dev", "test", "local":
		return "dev"
	default:
		return ""
	}
}

// NoopClient silently drops all events. Used in tests, in local dev when
// POSTHOG_API_KEY is unset, and in self-hosted instances that opt out.
type NoopClient struct{}

func (NoopClient) Capture(Event) {}
func (NoopClient) Close()        {}
