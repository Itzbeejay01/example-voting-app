# add curl for healthcheck
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl tini && \
    rm -rf /var/lib/apt/lists/*

FROM node:24-bookworm-slim AS base

WORKDIR /usr/local/app

COPY package*.json ./

RUN npm ci && \
 npm cache clean --force && \
 mv /usr/local/app/node_modules /node_modules

COPY . .

ENV PORT=8080
EXPOSE 8080

# Keep nodemon available for Docker Compose's development image only.
FROM base AS dev
RUN npm install -g nodemon
USER node
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]

# npm is required to assemble the image, not to serve application traffic.
# The Node base's bundled npm contains vulnerable undici and brace-expansion.
# Remove it from the final image; retain Node and the audited app dependencies.
FROM base AS final
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
USER node
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
