package selfhosttelemetry

import (
	"log/slog"
	"strings"
)

// Config is read once during API server startup. Endpoint selection is
// deliberately absent: self-host telemetry can only be sent to Multica's
// first-party collector compiled into the client.
type Config struct {
	Enabled bool
}

// ConfigFromDoNotTrack implements the deployment-level telemetry switch.
// Telemetry is off by default: only an explicit "0" or "false"
// (case-insensitive, trimmed) opts the deployment in, so a forked or
// self-hosted instance never reports anything without a deliberate operator
// decision.
func ConfigFromDoNotTrack(raw string) Config {
	raw = strings.TrimSpace(raw)
	enabled := raw == "0" || strings.EqualFold(raw, "false")
	return Config{Enabled: enabled}
}

// LogStartupStatus makes the switch observable without logging the raw
// environment value or any telemetry data.
func LogStartupStatus(logger *slog.Logger, config Config) {
	if config.Enabled {
		logger.Info("self-host telemetry enabled via DO_NOT_TRACK=0")
		return
	}
	logger.Info("self-host telemetry disabled (default off; set DO_NOT_TRACK=0 or false to enable)")
}
