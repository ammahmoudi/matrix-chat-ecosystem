# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
# Inject env vars as build args into Vite
ARG VITE_MAS_BASE_URL
ARG VITE_CLIENT_ID
ARG VITE_REDIRECT_BASE
ENV VITE_MAS_BASE_URL=$VITE_MAS_BASE_URL
ENV VITE_CLIENT_ID=$VITE_CLIENT_ID
ENV VITE_REDIRECT_BASE=$VITE_REDIRECT_BASE
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html/mas-admin
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
