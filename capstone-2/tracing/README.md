# Tracing procedure

Configure one Robot Shop service with `OTEL_SERVICE_NAME=catalogue` and `OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector.monitoring.svc:4318`, using that service runtime's OpenTelemetry auto-instrumentation. Generate a catalogue request, port-forward `service/jaeger` port 16686, and search for `catalogue`. Follow the web -> catalogue -> database path and save the trace ID. This requires a compatible instrumented image and was not verified locally.
