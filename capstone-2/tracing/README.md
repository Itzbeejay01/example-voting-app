# Tracing setup and verification

The upstream Robot Shop shipping service uses Java. Install the OpenTelemetry Operator, then create an Instrumentation resource in `robot-shop` and annotate the shipping Deployment in the fork. The operator injects the Java agent; no application source change is needed.

```sh
helm repo add open-telemetry https://open-telemetry.github.io/opentelemetry-helm-charts
helm upgrade --install opentelemetry-operator open-telemetry/opentelemetry-operator \
  --namespace opentelemetry-operator-system --create-namespace \
  --set manager.collectorImage.repository=otel/opentelemetry-collector-k8s \
  --set admissionWebhooks.certManager.enabled=false \
  --set admissionWebhooks.autoGenerateCert.enabled=true --wait
kubectl apply -f capstone-2/tracing/instrumentation.yaml
kubectl patch deployment shipping -n robot-shop --type=merge \
  --patch-file capstone-2/tracing/shipping-otel-patch.yaml
kubectl rollout status deployment/shipping -n robot-shop
kubectl -n robot-shop apply -f capstone-2/load-generator.yaml
kubectl -n monitoring port-forward service/jaeger 16686:16686
```

Open Jaeger at `http://localhost:16686`, choose service `shipping`, and inspect spans after the load generator has issued requests. Confirm the collector logs show exported spans and record a trace ID for evidence. Follow parent/child spans where propagation is supported by the upstream application. The CR, annotation, collector, and Jaeger are configured in code, but no live trace was captured for this submission.
