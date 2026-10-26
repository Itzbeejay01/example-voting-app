# Capstone 2 - Keep It Running

Robot Shop remains an external application. Fork `instana/robot-shop`, clone it beside this repository, and use its `K8s/helm` chart with the overrides here. This repository does not copy or overwrite its source. In the fork, remove the `INSTANA_AGENT_HOST` environment entries from the workload templates; the supplied values also leave EUM disabled. Confirm with `rg INSTANA K8s/helm` before installation.

```sh
kubectl create namespace robot-shop
helm upgrade --install robot-shop ../robot-shop/K8s/helm -n robot-shop -f capstone-2/robot-shop-values.yaml --wait --timeout 10m
kubectl set env deployment --all INSTANA_AGENT_HOST- -n robot-shop
kubectl -n robot-shop get pods
kubectl -n robot-shop port-forward service/web 8080:8080
kubectl apply -f capstone-2/load-generator.yaml
```

The official images must be checked with `docker buildx imagetools inspect IMAGE` before selecting ARM64 nodes. Use amd64 EKS nodes if a manifest lacks linux/arm64. Instana is disabled in the overrides. Upstream documents limited ARM support and is archived, so use amd64 unless every selected image manifest is verified for ARM64. Its Helm chart injects `INSTANA_AGENT_HOST`; remove those entries in the fork and verify with `rg INSTANA ../robot-shop/K8s/helm`. Upstream documents cart and payment Prometheus endpoints at `/metrics`. The web availability, failure fraction, and latency panels use blackbox probes; probe traffic is synthetic and is not labeled as end-user request volume. The dashboard avoids assuming generic `http_requests_total` metrics that upstream does not document.

Install observability:

```sh
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm upgrade --install prometheus-blackbox-exporter prometheus-community/prometheus-blackbox-exporter -n monitoring --create-namespace --wait
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack -n monitoring --create-namespace -f capstone-2/monitoring/kube-prometheus-stack-values.yaml
helm upgrade --install loki grafana/loki -n logging --create-namespace -f capstone-2/logging/loki-values.yaml
helm upgrade --install fluent-bit fluent/fluent-bit -n logging -f capstone-2/logging/fluent-bit-values.yaml
kubectl apply -f capstone-2/tracing/jaeger.yaml -f capstone-2/tracing/otel-collector.yaml
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm upgrade --install opentelemetry-operator open-telemetry/opentelemetry-operator -n opentelemetry-operator-system --create-namespace --set manager.collectorImage.repository=otel/opentelemetry-collector-k8s --set admissionWebhooks.certManager.enabled=false --set admissionWebhooks.autoGenerateCert.enabled=true --wait
kubectl apply -f capstone-2/tracing/instrumentation.yaml
kubectl patch deployment shipping -n robot-shop --type=merge --patch-file capstone-2/tracing/shipping-otel-patch.yaml
```

Publish the dashboard JSON to Grafana's sidecar with:

```sh
kubectl create configmap robot-shop-dashboard -n monitoring --from-file=robot-shop-dashboard.json=capstone-2/monitoring/robot-shop-dashboard.json --dry-run=client -o yaml | kubectl label --local -f - grafana_dashboard=1 -o yaml | kubectl apply -f -
```

Create the `slack-webhook` Secret in `monitoring` out of band with key `url`; never put the webhook in values or Git. Generate app traffic with the load generator and confirm `up{job="robot-shop-cart"}` and `up{job="robot-shop-payment"}` equal 1 before inspecting their native metrics. Web probe queries: `robot_shop:availability:ratio_5m`; failure fraction `1 - robot_shop:availability:ratio_5m`; p95 duration `quantile_over_time(0.95, probe_duration_seconds{job="robot-shop-web"}[5m])`. No live cluster, dashboard data, logs, alerts, or traces were verified during repository preparation.
