# Verification record

## Follow-up checks (October 26, 2026)

- Instructor PDF was not present in the workspace; the supplied detailed assignment was used.
- `POSTGRES_PASSWORD=local-test-password docker compose config --quiet`: passed for the main Compose file, image-based Compose file, and Result test Compose file.
- `npm test` in `result`: 3 passed, 0 failed.
- `npm audit --omit=dev --audit-level=high` in `result`: 0 vulnerabilities.
- `git diff --check`: passed.
- Robot Shop dashboard JSON and Prometheus values YAML parsed successfully; 3 real scrape jobs are configured for web probes, cart, and payment.
- Docker builds could not run because the Docker daemon socket was unavailable.
- Terraform, Helm, and actionlint executables were not available in this environment, so their checks and deployment workflows were not repeated.

The verification entries below were recorded in the repository before this follow-up; they were not independently repeated during it.

Local verification on Apple Silicon:

- `npm test` in `result`: 3 passed, 0 failed.
- `npm audit --omit=dev --audit-level=low`: 0 vulnerabilities.
- `docker compose config --quiet`: passed.
- Vote, Result, and Worker image builds: passed.
- Runtime IDs: Vote 10001, Result 1000, Worker 999.
- Redis and PostgreSQL health checks: healthy.
- HTTP vote submission, Worker processing log, and live Socket.IO score: passed.
- Terraform 1.14.5 `fmt -check` and `validate`: passed; no plan/apply was run.
- Helm 3.19 lint: passed; render produced 10 resources.
- kubeconform 0.7 strict validation: 10 Voting App resources and 6 Capstone 2 resources valid.
- actionlint 1.7.7: passed.

Not locally verified: AWS apply/destroy/recreate, Kubernetes release/rollback, GHCR publication, GitHub OIDC deployment, Robot Shop pods or image architecture, live Prometheus metrics, Grafana panels, Loki queries, Jaeger traces, Slack alerts, and incident simulation.

## Helm deployment and rollback evidence (October 26, 2026)

This addendum records a later run against the existing local kind cluster. It supersedes the earlier statement above only for the Voting App Helm release and rollback. The AWS, GHCR publication, and OIDC items remain unverified.

### Existing cluster and release

- `kubectl config current-context`: `kind-devops-capstone`.
- Cluster: kind `devops-capstone`, Kubernetes v1.37.0; Helm v4.3.1.
- Before changes, the release was revision 1 with status `failed` from its original timeout. The five workloads had since been repaired in-place and were Ready.
- Existing PVC `db-data` was `Bound`, UID `cce684d0-4ed3-46ef-8e6e-4f488c37bf5d`, volume `pvc-cce684d0-4ed3-46ef-8e6e-4f488c37bf5d`.
- Existing Secret `voting-app-db` was present. Its UID remained `423ddaf7-c342-411e-aa42-27df90d4a90f`. Secret data was not read or changed.

### Root causes and permanent chart fixes

The earlier failed installation had four workload causes:

1. Vote had been built from the development Docker stage, which omitted `/usr/local/app/app.py`. The chart and CI now target the production `final` stage.
2. Result used a named `node` user, which Kubernetes could not validate as non-root. The chart now sets numeric UID/GID 1000.
3. Worker used named `appuser`, which Kubernetes could not validate as non-root. The chart now sets numeric UID/GID 999. Vote is explicitly UID/GID 10001.
4. PostgreSQL had restrictive non-root pod and container contexts, preventing the official image entrypoint from initializing the persistent data directory. The chart now leaves those contexts unset for PostgreSQL so the entrypoint can initialize the existing volume and drop privileges normally. No PVC was deleted or recreated.

Those misconfigurations caused the original Helm installation to time out while Deployments were not becoming Ready.

For the local deployment, the chart now defaults the web Services to `ClusterIP`, targets the containers' port 8080, and retains HTTP readiness/liveness probes for both web apps.

Redis remained configured with its existing non-root UID/GID 999 setup. The chart continues to reference the existing Secret keys (`password`, `url`, `connectionString`) and existing `db-data` claim. Resource requests and limits remain set. Image repository, commit tag, pull policy, and private registry pull Secret are configurable. Local kind settings are isolated in `helm/voting-app/values-kind.yaml`.

### Validation and image build

Commands run for this revision:

```text
helm lint helm/voting-app -f helm/voting-app/values-kind.yaml  -> passed (1 chart, 0 failed)
helm template voting-app helm/voting-app -n voting-app -f helm/voting-app/values-kind.yaml -> passed
kubectl apply --dry-run=server -n voting-app -f /tmp/voting-app-rendered.yaml -> all 10 resources accepted
cd result && npm test -> 3 passed, 0 failed
cd result && npm audit --omit=dev --audit-level=high -> 0 vulnerabilities
python3 -m compileall -q vote/app.py -> passed
POSTGRES_PASSWORD=ci-local-placeholder docker compose config --quiet -> passed
```

The current commit at build time was `7e19af6902c7`. Rebuilt images were tagged with that commit and loaded into the existing kind node:

```text
docker build --target final -t voting-vote:7e19af6902c7 ./vote -> passed
Vote image inspection: /usr/local/app/app.py exists; image identity uid=10001, gid=10001
docker build -t voting-result:7e19af6902c7 ./result -> passed; identity uid=1000, gid=1000
docker build -t voting-worker:7e19af6902c7 ./worker -> passed; identity uid=999, gid=999
kind load docker-image --name devops-capstone [three images] -> passed
```

The server-side dry run printed warnings that the existing Helm-created resources lack `kubectl.kubernetes.io/last-applied-configuration`; it was a dry run and made no changes. It validated the rendered resource schemas against the live Kubernetes API.

### Helm reconciliation and end-to-end test

Before upgrade, the PVC and Secret identities above were recorded. The upgrade command was:

```sh
helm upgrade --install voting-app helm/voting-app -n voting-app \
  -f helm/voting-app/values-kind.yaml --wait --timeout 5m
```

Revision 2 completed with status `deployed`. All five deployments became `1/1 Available`; Vote, Result, and Worker used image tag `7e19af6902c7`. PostgreSQL and Redis were healthy. The PVC UID, volume, and bound status were unchanged, as was the database Secret UID. Application process identities observed with `kubectl exec ... -- id` were Vote 10001, Result 1000, and Worker 999.

Both port-forwarded endpoints returned HTTP 200 (`localhost:9080` Vote and `localhost:9081` Result). A fresh HTTP POST to Vote submitted option `a` and set a new voter cookie. Worker logs showed `Processing vote for 'a'`; PostgreSQL counts advanced from `a=1` to `a=2`; a Socket.IO `scores` event returned `{"a":2,"b":0}`.

### Deliberately failed upgrade and explicit rollback

The known-good revision was 2. The failure was introduced only on the Vote image, with no `--atomic` or `--rollback-on-failure`:

```sh
helm upgrade voting-app helm/voting-app -n voting-app \
  -f helm/voting-app/values-kind.yaml \
  --set-string images.vote.tag=capstone-invalid-rollback-demo \
  --set-string images.vote.pullPolicy=Always --wait --timeout 60s
```

The command exited 1 after the bounded wait; Helm recorded revision 3 as `failed`. Kubernetes events included:

```text
Failed to pull image "voting-vote:capstone-invalid-rollback-demo"
Error: ErrImagePull
Error: ImagePullBackOff
```

Only Vote’s pod template used the bad tag. Redis and PostgreSQL were not changed. Revision 2 remained the last known-good release. The explicit recovery command was:

```sh
helm rollback voting-app 2 -n voting-app --wait --timeout 5m
```

Helm reported `Rollback was a success`; revision 4 is `deployed` with description `Rollback to 2`. All five deployments rolled out successfully. The original Vote image `voting-vote:7e19af6902c7` was restored. The PVC stayed bound with the same UID and volume; the Secret kept the same UID.

After rollback both endpoints again returned HTTP 200. A fresh option-`b` vote returned HTTP 200, Worker logged `Processing vote for 'b'`, PostgreSQL counts were `a=2`, `b=1`, and the Socket.IO event returned `{"a":2,"b":1}`. The final five pods were Ready with zero restarts.

### Workflow and environment limits

CI builds Vote using the `final` Docker stage, runs available Result tests and Vote syntax compilation, builds all three images, scans them with Trivy, and publishes commit-SHA tags to GHCR only on non-PR events using `GITHUB_TOKEN`. The latest remote CI run before these unpushed changes failed before scanning because `aquasecurity/trivy-action@0.33.1` did not resolve; this change pins the published v0.36.0 action commit. The corrected workflow has not run remotely yet, so CI is not claimed green. Deployment remains a separate manual workflow using an OIDC role and protected `capstone-aws` environment. This local run did not publish packages, access AWS, or deploy to EKS. Terraform validation is not evidence of cloud infrastructure creation.
