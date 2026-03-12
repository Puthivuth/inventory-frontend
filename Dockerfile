# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Production stage
FROM node:20-alpine AS prod

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY --from=build /app/.next .next
COPY --from=build /app/public ./public
COPY --from=build /app/next.config.js ./next.config.js

EXPOSE 3000

CMD ["npx", "next", "start", "-p", "3000"]
