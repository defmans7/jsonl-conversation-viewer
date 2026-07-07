# ---- build stage ----
FROM oven/bun:1 AS build
WORKDIR /app
COPY src/ ./src/
COPY build.js ./
RUN bun run build.js

# ---- production stage ----
FROM oven/bun:1-slim AS production
WORKDIR /app
COPY --from=build /app/dist ./dist
COPY serve.prod.js ./
EXPOSE 3000
ENV PORT=3000
CMD ["bun", "run", "serve.prod.js"]
