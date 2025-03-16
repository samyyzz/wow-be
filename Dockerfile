# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Receive build arguments from docker-compose.yml
ARG SECRET_KEY
ARG MONGO_CONNECTION_URL

# Set environment variables using build arguments
ENV SECRET_KEY=$SECRET_KEY 
ENV MONGO_CONNECTION_URL=$MONGO_CONNECTION_URL

# Build the TypeScript code
RUN npm run build

# Expose the port your app runs on
EXPOSE 3000

# Run the application
CMD [ "npm", "start" ]