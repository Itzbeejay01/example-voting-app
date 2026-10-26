# Log queries

- Catalogue logs: `{namespace="robot-shop",service="catalogue"}`
- Errors and fatal messages: `{namespace="robot-shop"} |~ "(?i)(error|fatal)"`
- Warnings: `{namespace="robot-shop"} |~ "(?i)warn(ing)?"`
- Payment failures: `{namespace="robot-shop",service="payment"} |~ "(?i)(error|fail|declin)"`
- Structured JSON severity, when present: `{namespace="robot-shop"} | json | level=~"(?i)error|fatal"`

Validate with generated traffic and compare query timestamps to pod logs.
