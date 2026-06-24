# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS build

WORKDIR /app

RUN apk add --no-cache git openssh-client

ARG NEXT_PUBLIC_AUTH_API_BASE_URL=https://aottg2.com
ARG NEXT_PUBLIC_AUTH_FRONTEND_BASE_URL=https://aottg2.com
ARG NEXT_PUBLIC_WORKSHOP_API_BASE_URL=https://workshop.aottg2.com
ARG NEXT_PUBLIC_SITE_URL=https://workshop.aottg2.com

ENV NEXT_PUBLIC_AUTH_API_BASE_URL=$NEXT_PUBLIC_AUTH_API_BASE_URL
ENV NEXT_PUBLIC_AUTH_FRONTEND_BASE_URL=$NEXT_PUBLIC_AUTH_FRONTEND_BASE_URL
ENV NEXT_PUBLIC_WORKSHOP_API_BASE_URL=$NEXT_PUBLIC_WORKSHOP_API_BASE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

COPY package*.json ./
RUN --mount=type=secret,id=github_token,required=false \
    token="$(cat /run/secrets/github_token 2>/dev/null || true)" \
    && if [ -n "$token" ]; then \
      git config --global url."https://x-access-token:${token}@github.com/".insteadOf "ssh://git@github.com/"; \
    else \
      git config --global url."https://github.com/".insteadOf "ssh://git@github.com/"; \
    fi \
    && npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

EXPOSE 3000
CMD ["npm", "run", "preview", "--", "-p", "3000"]
