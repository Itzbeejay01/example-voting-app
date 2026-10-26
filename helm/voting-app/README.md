# Voting App Helm chart

This chart deploys Vote, Result, Worker, Redis, and PostgreSQL. Application images use configurable repositories, tags, pull policies, and optional Kubernetes image pull Secrets. Supply immutable commit SHA tags in deployed environments. The defaults are illustrative version tags.

## Database Secret prerequisite

Create the namespace and `voting-app-db` Secret before installing. The chart does not create or replace this Secret. It expects these keys:

- `password`: PostgreSQL initialization password
- `url`: PostgreSQL URL consumed by Result
- `connectionString`: PostgreSQL connection string consumed by Worker

Provision the Secret with your local secret manager or approved secure process. Do not put credentials in values files, command output, or Git. For an existing installation, preserve the Secret and database PVC.

## Local kind deployment

Build the production Vote stage and the other app images with the same commit tag, then load them into kind:

```sh
TAG=$(git rev-parse --short=12 HEAD)
docker build --target final -t "voting-vote:${TAG}" ./vote
docker build -t "voting-result:${TAG}" ./result
docker build -t "voting-worker:${TAG}" ./worker
kind load docker-image --name devops-capstone \
  "voting-vote:${TAG}" "voting-result:${TAG}" "voting-worker:${TAG}"
```

The committed `values-kind.yaml` records the verified local image names, pull policies, and tag. `Never` prevents kind from attempting a registry pull for these local images. When building a different commit, pass its tag to Helm as shown below (or update the file's tag values).

Check the context before applying changes, then upgrade the existing release:

```sh
kubectl config current-context  # must be kind-devops-capstone
helm lint . -f values-kind.yaml
helm template voting-app . -n voting-app -f values-kind.yaml \
  --set-string images.vote.tag="$TAG" \
  --set-string images.result.tag="$TAG" \
  --set-string images.worker.tag="$TAG"
helm upgrade --install voting-app . -n voting-app \
  -f values-kind.yaml \
  --set-string images.vote.tag="$TAG" \
  --set-string images.result.tag="$TAG" \
  --set-string images.worker.tag="$TAG" --wait --timeout 5m
```

Do not uninstall the release to repair it. The chart references the existing `db-data` PVC and Secret. PostgreSQL intentionally has no restrictive pod or container security context: the official image entrypoint needs its normal root startup to initialize or repair data-directory ownership before it drops to the `postgres` account. Vote, Result, Worker, and Redis retain non-root security contexts.

## Private GHCR and EKS

For private GHCR packages, provision a namespace-scoped `kubernetes.io/dockerconfigjson` Secret named `ghcr-pull` using an authorized read-only package token. The manual AWS deployment workflow references that Secret. For a separate Helm deployment, pass its name:

```sh
helm upgrade --install voting-app . -n voting-app \
  --set 'imagePullSecrets[0].name=ghcr-pull' \
  --set-string images.vote.tag="$GIT_SHA" \
  --set-string images.result.tag="$GIT_SHA" \
  --set-string images.worker.tag="$GIT_SHA" \
  --set postgres.existingSecret=voting-app-db --wait --timeout 5m
```

The AWS workflow is manual and protected by the `capstone-aws` GitHub environment and OIDC role. It was not invoked during local kind verification. Terraform validation and the local cluster are not evidence of an AWS deployment.

## Verification and rollback

Check the release, workloads, services, and storage:

```sh
helm status voting-app -n voting-app
helm history voting-app -n voting-app
kubectl get deploy,pods,svc,pvc -n voting-app -o wide
kubectl rollout status deployment/vote -n voting-app --timeout=2m
```

Rollback procedure and actual revision numbers from the October 26, 2026 local kind run are recorded in [`docs/verification.md`](../../docs/verification.md). That run deployed a deliberately invalid Vote tag without `--atomic`, captured the image-pull failure, explicitly rolled back to revision 2, and verified recovery on revision 4.
