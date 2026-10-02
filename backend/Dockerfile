# backend/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies first for optimal Docker layer caching
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application source
COPY . .

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]