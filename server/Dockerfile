# Use Node 22 base image
FROM node:22

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port (Zeabur uses 8080 by default)
EXPOSE 8080

# Environment variable for port
ENV PORT=8080

# Start command
CMD ["node", "index.js"]
