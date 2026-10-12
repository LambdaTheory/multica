package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/multica-ai/multica/server/internal/analytics"
	"github.com/multica-ai/multica/server/internal/events"
	"github.com/multica-ai/multica/server/internal/featureflags"
	"github.com/multica-ai/multica/server/internal/handler"
	"github.com/multica-ai/multica/server/internal/realtime"
	"github.com/multica-ai/multica/server/pkg/featureflag"
)

// billingWiringCloudURL is a syntactically valid Cloud URL; whether the
// commercial clients actually assemble from it is asserted per case.
const billingWiringCloudURL = "https://cloud.internal"

// buildBillingWiringRouter assembles the production router with a static
// provider whose workspace-subscriptions flag is ON, so the published
// billing_workspace_subscriptions decision depends solely on the injected
// billing switch. MULTICA_CLOUD_URL is controlled by the caller via t.Setenv.
func buildBillingWiringRouter(t *testing.T, billingEnabled bool) (http.Handler, *handler.Handler) {
	t.Helper()
	provider := featureflag.NewStaticProvider()
	provider.Set(featureflags.BillingWorkspaceSubscriptions, featureflag.Rule{Default: true})
	flags := featureflag.NewService(provider)
	r, h := NewRouterWithOptions(nil, realtime.NewHub(), events.New(), analytics.NoopClient{}, nil, RouterOptions{
		FeatureFlags:   flags,
		BillingEnabled: billingEnabled,
	})
	return r, h
}

func fetchConfigFlags(t *testing.T, r http.Handler) map[string]bool {
	t.Helper()
	req := httptest.NewRequest(http.MethodGet, "/api/config", nil)
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusOK {
		t.Fatalf("GET /api/config: expected 200, got %d: %s", w.Code, w.Body.String())
	}
	var cfg struct {
		FeatureFlags map[string]bool `json:"feature_flags"`
	}
	if err := json.Unmarshal(w.Body.Bytes(), &cfg); err != nil {
		t.Fatalf("decode /api/config: %v", err)
	}
	return cfg.FeatureFlags
}

// TestBillingSwitchRouterWiring pins the assembly matrix across the billing
// switch and MULTICA_CLOUD_URL: the switch gates the entitlement / seat-capacity
// wiring, the Cloud URL gates the clients themselves, and the public flags
// always mirror the switch.
func TestBillingSwitchRouterWiring(t *testing.T) {
	t.Run("switch off ignores a configured Cloud URL", func(t *testing.T) {
		t.Setenv("MULTICA_CLOUD_URL", billingWiringCloudURL)
		r, h := buildBillingWiringRouter(t, false)

		if h.Entitlements != nil || h.SeatCapacity != nil || h.SeatCapacityWorker != nil {
			t.Fatal("billing-disabled router must not wire commercial dependencies even with a Cloud URL")
		}
		flags := fetchConfigFlags(t, r)
		if flags["billing_enabled"] || flags["billing_workspace_subscriptions"] {
			t.Fatalf("public flags = %v, want both false — the switch must dominate the enabled subscriptions flag", flags)
		}
	})

	t.Run("switch on with a Cloud URL restores the assembly", func(t *testing.T) {
		t.Setenv("MULTICA_CLOUD_URL", billingWiringCloudURL)
		r, h := buildBillingWiringRouter(t, true)

		if h.Entitlements == nil {
			t.Fatal("billing-enabled router with a Cloud URL must wire the entitlement provider")
		}
		if h.SeatCapacity == nil || h.SeatCapacityWorker == nil {
			t.Fatal("billing-enabled router with a Cloud URL must wire seat capacity and its worker")
		}
		flags := fetchConfigFlags(t, r)
		if !flags["billing_enabled"] || !flags["billing_workspace_subscriptions"] {
			t.Fatalf("public flags = %v, want both true", flags)
		}
	})

	t.Run("switch on without a Cloud URL keeps the clients off", func(t *testing.T) {
		t.Setenv("MULTICA_CLOUD_URL", "")
		r, h := buildBillingWiringRouter(t, true)

		// Existing self-hosted rule: without a Cloud URL the entitlement and
		// seat-capacity clients cannot be built, but the switch is still
		// published so clients learn the deployment is commercial-capable.
		if h.Entitlements != nil || h.SeatCapacity != nil || h.SeatCapacityWorker != nil {
			t.Fatal("without a Cloud URL the commercial clients must stay nil")
		}
		flags := fetchConfigFlags(t, r)
		if !flags["billing_enabled"] || !flags["billing_workspace_subscriptions"] {
			t.Fatalf("public flags = %v, want both true", flags)
		}
	})
}

// TestBillingDisabledRouterBlockedSurfaces pins the request-facing behavior of
// the default (switch off) router even with a Cloud URL configured: the
// removed promo routes answer 404 and the Stripe webhook gets an explicit
// non-2xx instead of a forwarded delivery.
func TestBillingDisabledRouterBlockedSurfaces(t *testing.T) {
	t.Setenv("MULTICA_CLOUD_URL", billingWiringCloudURL)
	r, _ := buildBillingWiringRouter(t, false)

	removed := []struct{ method, path string }{
		{http.MethodPost, "/api/contact-sales"},
		{http.MethodPost, "/api/me/onboarding/cloud-waitlist"},
	}
	for _, route := range removed {
		req := httptest.NewRequest(route.method, route.path, strings.NewReader("{}"))
		w := httptest.NewRecorder()
		r.ServeHTTP(w, req)
		if w.Code != http.StatusNotFound {
			t.Fatalf("removed route %s %s: expected 404, got %d: %s", route.method, route.path, w.Code, w.Body.String())
		}
	}

	// Billing off means no upstream to verify signatures against — explicit
	// 403, never a fake 2xx.
	req := httptest.NewRequest(http.MethodPost, "/api/webhooks/stripe", strings.NewReader(`{"id":"evt"}`))
	req.Header.Set("Stripe-Signature", "t=1,v1=deadbeef")
	w := httptest.NewRecorder()
	r.ServeHTTP(w, req)
	if w.Code != http.StatusForbidden {
		t.Fatalf("POST /api/webhooks/stripe: expected 403 on billing-disabled router, got %d: %s", w.Code, w.Body.String())
	}
	if !strings.Contains(w.Body.String(), "billing_disabled") {
		t.Fatalf("webhook body = %s, want billing_disabled code", w.Body.String())
	}
}
