# Robot Shop availability runbook

1. Acknowledge the alert and record its start time; do not post secrets in chat.
2. Check `kubectl -n robot-shop get pods,deploy,svc` and recent events.
3. Compare request rate, 5xx rate, p95 latency, and logs by service.
4. Mitigate with `kubectl rollout undo deployment/NAME -n robot-shop` or scale a healthy deployment. Preserve evidence first.
5. Verify recovery using real load, the SLI query, and application checks for web, catalogue, cart, and payment.
6. Open a blameless postmortem using the template. Rotate the Slack webhook if exposed.

Slack routing must reference a Kubernetes secret named `slack-webhook`; create it out of band and configure Alertmanager to read `/etc/alertmanager/secrets/slack-webhook/url`. Do not commit the URL.
