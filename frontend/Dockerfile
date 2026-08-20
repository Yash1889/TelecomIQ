# Use official Node image
FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy frontend code and build
COPY . .
RUN npm run build

# Install lightweight static server
RUN npm install -g serve

# Expose Vite preview/serve port
EXPOSE 5173

CMD ["serve", "-s", "dist", "-l", "5173"]
