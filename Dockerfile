# Use the official Node.js image as the base image
FROM node:14

# Set the working directory in the container
WORKDIR /app

# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# Copy the rest of the application code to the working directory
COPY . /app

# Install dependencies
RUN npm install
RUN npm install -g @angular/cli