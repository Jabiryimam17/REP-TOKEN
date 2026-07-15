FROM node:20-alpine

WORKDIR /app

# Copy package files first for better layer caching
COPY package.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy source code and uploads directory
COPY . .

# Create uploads directory for profile pictures
# Railway provides an ephemeral disk at /data; we use a local dir by default
RUN mkdir -p /app/uploads/profile_pictures

# The server listens on port 3333 by default (server.js)
# Railway sets PORT env var; we honor it via the server.js below
EXPOSE 3333

CMD ["npm", "start"]
