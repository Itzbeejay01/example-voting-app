# Log queries

- Service logs: `{namespace="robot-shop",service="catalogue"}`
- Errors: `{namespace="robot-shop"} | json | level=~"(?i)error|fatal"`
- Payment failures: `{namespace="robot-shop",service="payment"} |= "error"`

Validate with generated traffic and compare query timestamps to pod logs.
