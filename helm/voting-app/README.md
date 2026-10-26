# Voting App Helm chart

Create the database secret, then install with immutable SHA tags:

```sh
kubectl create namespace voting
read -r -s -p 'Choose an alphanumeric database password: ' DB_PASSWORD; echo
kubectl -n voting create secret generic voting-app-db \
  --from-literal=password="$DB_PASSWORD" \
  --from-literal=url="postgres://postgres:${DB_PASSWORD}@db/postgres" \
  --from-literal=connectionString="Server=db;Username=postgres;Password=${DB_PASSWORD};"
unset DB_PASSWORD
IMAGE_TAG=$(git rev-parse HEAD)
helm upgrade --install voting-app . -n voting --set images.vote.tag="$IMAGE_TAG" --set images.result.tag="$IMAGE_TAG" --set images.worker.tag="$IMAGE_TAG" --wait --timeout 5m
```

For a rollback demo, record `helm history voting-app -n voting`, deploy a nonexistent tag with `--set images.vote.tag=intentionally-bad`, observe `kubectl rollout status deployment/vote -n voting --timeout=90s` fail, then run `helm rollback voting-app PREVIOUS_REVISION -n voting --wait`. Verify pods and both HTTP endpoints. This live demonstration was not run without an approved cluster.
