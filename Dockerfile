# Stage 1: Build
FROM node:22 AS build
WORKDIR /src

# Copy package files first to leverage Docker cache
COPY package*.json ./
RUN npm install

# Copy the rest of the source code and build
COPY . .
RUN npm run build

# Stage 2: Output (Extracting static files)
FROM scratch AS output
COPY --from=build /src/dist /

# Stage 3: Runtime (Serving with Caddy as per Zeabur's default static site runner)
FROM zeabur/caddy-static AS runtime
COPY --from=output / /usr/share/caddy
