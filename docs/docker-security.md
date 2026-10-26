# Docker security

Vote runs as UID 10001, Result as the official Node UID 1000, and Worker as UID 999. Web processes bind to container port 8080, so they need no privileged-port capability. Vote suppresses bytecode writes for its development bind mount. Build contexts exclude source-control metadata, environment files, caches, dependencies, and build output. Base images use supported version lines; Redis is pinned to 7.4, PostgreSQL to 15, Node to 24, Python to 3.11.17, and the Worker runtime to .NET 10.0.14.

Credentials in Compose are development defaults. Kubernetes uses an existing Secret and CI uses GitHub's token or AWS OIDC. Never reuse the Compose database password outside local development.

Image tags can move within a release line. Before a production release, record multi-architecture digests with `docker buildx imagetools inspect` and update image references after testing the exact digest.
