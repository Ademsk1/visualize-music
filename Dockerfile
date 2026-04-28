FROM node:20-alpine AS base
WORKDIR /app
ENV CI=true

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS dev
COPY . .
EXPOSE 5173
CMD ["npm","run","dev","--","--host","0.0.0.0","--port","5173"]

FROM deps AS build
COPY . .
RUN npm run build

FROM base AS preview
COPY --from=build /app/dist /app/dist
RUN npm add -g serve
EXPOSE 4173
CMD ["serve","-s","dist","-l","4173"]

