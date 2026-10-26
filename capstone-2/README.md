# Capstone 2 - Keep It Running

Robot Shop remains an external application. Fork `instana/robot-shop`, clone it beside this repository, and use its `K8s/helm` chart with the overrides here. This repository does not copy or overwrite its source. In the fork, remove the `INSTANA_AGENT_HOST` environment entries from the workload templates; the supplied values also leave EUM disabled. Confirm with `rg INSTANA K8s/helm` before installation.

```sh
kubectl create namespace robot-shop
helm upgrade --install robot-shop ../robot-shop/K8s/helm -n robot-shop -f capstone-2/robot-shop-values.yaml --wait --timeout 10m
kubectl -n robot-shop get pods
kubectl -n robot-shop port-forward service/web 8080:8080
kubectl apply -f capstone-2/load-generator.yaml
```

The official images must be checked with `docker buildx imagetools inspect IMAGE` before selecting ARM64 nodes. Use amd64 EKS nodes if a manifest lacks linux/arm64. Instana is disabled in the overrides.

Install observability:

```sh
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack -n monitoring --create-namespace -f capstone-2/monitoring/kube-prometheus-stack-values.yaml
helm upgrade --install loki grafana/loki -n logging --create-namespace -f capstone-2/logging/loki-values.yaml
helm upgrade --install fluent-bit fluent/fluent-bit -n logging -f capstone-2/logging/fluent-bit-values.yaml
kubectl apply -f capstone-2/tracing/jaeger.yaml -f capstone-2/tracing/otel-collector.yaml
```

Import the dashboard JSON or allow the Grafana sidecar to discover its ConfigMap. Generate traffic before evaluating request/error/latency panels. No live cluster, dashboard data, logs, alerts, or traces were verified during repository preparation.
