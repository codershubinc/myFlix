# Use official Node.js LTS image
FROM oven/bun:1.0.25

# Set working directory
WORKDIR /video-stream

# Copy package files and install dependencies
COPY package.json bun.lockb ./
RUN bun install

# Copy source code
COPY . .

# Expose port (NestJS default)
EXPOSE 3000

# Start the NestJS app
CMD ["bun", "start"]
