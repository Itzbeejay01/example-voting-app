# Safe incident drill and postmortem template

In a dedicated test namespace, capture the healthy baseline, then scale `catalogue` to zero. Confirm the alert and logs, restore the previous replica count, and verify live requests. Do not run this against shared or production services.

## Postmortem

- Date, duration, severity, facilitator:
- Customer impact and SLO/error-budget impact:
- Detection and alert timeline:
- Mitigation and recovery timeline:
- Technical root cause and contributing conditions:
- What worked / what was difficult:
- Corrective actions, owners, and due dates:
- Evidence links (alerts, graphs, logs, trace IDs, commands):

No incident drill was executed while preparing this repository.
