FROM mcr.microsoft.com/playwright:v1.56.1-noble

WORKDIR /tests
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .

USER pwuser
CMD ["node", "render.js", "http://result:8080"]
