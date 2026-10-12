package featureflags

import (
	"context"
	"testing"

	"github.com/multica-ai/multica/server/pkg/featureflag"
)

func staticFlags(key string, enabled bool) *featureflag.Service {
	provider := featureflag.NewStaticProvider()
	if key != "" {
		provider.Set(key, featureflag.Rule{Default: enabled})
	}
	return featureflag.NewService(provider)
}

// TestEvaluateFrontendPublicFlagsBillingCombination pins the pure evaluation
// of the public billing decisions: billing_enabled mirrors the injected
// switch, and billing_workspace_subscriptions is the AND of the switch and
// the subscriptions flag.
func TestEvaluateFrontendPublicFlagsBillingCombination(t *testing.T) {
	t.Parallel()
	ctx := context.Background()

	cases := []struct {
		name           string
		billingEnabled bool
		subscriptions  bool
		wantBilling    bool
		wantSubs       bool
	}{
		{name: "switch off flag off", billingEnabled: false, subscriptions: false, wantBilling: false, wantSubs: false},
		{name: "switch off dominates flag on", billingEnabled: false, subscriptions: true, wantBilling: false, wantSubs: false},
		{name: "switch on flag off", billingEnabled: true, subscriptions: false, wantBilling: true, wantSubs: false},
		{name: "both on", billingEnabled: true, subscriptions: true, wantBilling: true, wantSubs: true},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			out := EvaluateFrontendPublicFlags(ctx,
				staticFlags(BillingWorkspaceSubscriptions, tc.subscriptions), tc.billingEnabled)
			if out[BillingEnabled] != tc.wantBilling {
				t.Fatalf("billing_enabled = %v, want %v", out[BillingEnabled], tc.wantBilling)
			}
			if out[BillingWorkspaceSubscriptions] != tc.wantSubs {
				t.Fatalf("billing_workspace_subscriptions = %v, want %v", out[BillingWorkspaceSubscriptions], tc.wantSubs)
			}
		})
	}
}

// TestEvaluateFrontendPublicFlagsNilServiceAndCompatKeys covers the no-flag-
// config boot (nil service): non-billing public flags fall back to their off
// defaults, the billing switch still publishes the injected value, and the
// retired compat keys stay enabled for installed clients.
func TestEvaluateFrontendPublicFlagsNilServiceAndCompatKeys(t *testing.T) {
	t.Parallel()
	ctx := context.Background()

	out := EvaluateFrontendPublicFlags(ctx, nil, true)
	if !out[BillingEnabled] {
		t.Fatal("billing_enabled: want true, the injected switch must publish even without flag config")
	}
	if out[BillingWorkspaceSubscriptions] {
		t.Fatal("billing_workspace_subscriptions: want false without flag config (flag default is off)")
	}
	for _, key := range []string{ComposioMCPApps, PluginsV1} {
		if out[key] {
			t.Fatalf("%s: want false by default, got true", key)
		}
	}
	for _, key := range []string{agentBuilderCompat, agentSkillTogglesCompat, resourceLabelsCompat} {
		if !out[key] {
			t.Fatalf("%s: want true for installed clients, got false", key)
		}
	}
}
