# Stage 1: build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


# Stage 2: run
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app ./

RUN npm install -g next

EXPOSE 3001

CMD ["npm", "start"]