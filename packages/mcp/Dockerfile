FROM node:20-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/lib/package.json packages/lib/package.json
COPY packages/mcp/package.json packages/mcp/package.json

RUN npm install --workspace @markdown-confluence/lib --workspace @markdown-confluence/mcp

COPY packages/lib packages/lib
COPY packages/mcp packages/mcp

RUN npm run build -w @markdown-confluence/mcp

FROM node:20-slim

WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/packages/mcp/dist ./dist
COPY --from=build /app/packages/mcp/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

CMD ["node", "/app/dist/index.js"]
