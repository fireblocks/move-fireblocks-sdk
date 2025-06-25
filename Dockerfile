# Use an official Node.js image as the base
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Install ts-node and typescript globally (optional if included in package.json)
RUN npm install -g ts-node typescript

# Copy the rest of the source code
COPY . .

# Set environment variable if needed (optional)
ENV NODE_ENV=production

# Expose the port your app runs on (adjust as needed)
EXPOSE 3000

# Command to run your server with ts-node
CMD ["ts-node", "src/server.ts"]
