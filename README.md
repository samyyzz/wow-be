## Getting Started

### Prerequisites

- Node.js (version >= 18)
- npm (or yarn)
- MongoDB (local or cloud)
- Docker (optional, for containerization)

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/samyyzz/wow-be.git
    cd wow-be
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Create a `.env` file in the root directory with the following environment variables:

    ```
    MONGO_CONNECTION_URL= mongodb://localhost:27017/wow_db
    SECRET= your_secret_key
    ```

    **Note:** Replace `your_secret_key` with a strong, secure secret.

### Development

1.  Run the development server:

    ```bash
    npm run dev
    ```

    This command will:

    -   Copy the `.env` file to the `dist` directory.
    -   Build the TypeScript code using `tsc`.
    -   Start the Node.js server from the `dist` directory.

### Build and Start

1.  Build the TypeScript code:

    ```bash
    npm run build
    ```

2.  Start the production server:

    ```bash
    npm start
    ```

    This command will start the Node.js server from the `dist` directory, using the environment variables from the `.env` file in the `dist` folder.

## Docker Setup

This project can be containerized using Docker.

### Docker Build

1.  Build the Docker image:

    ```bash
    docker build -t wow-be .
    ```

## Docker Setup (Recommended)

This project can be containerized using Docker.

### Docker Pull and Run (Recommended)

1.  **Create a Docker network:**
    ```bash
    docker network create wow_network
    ```

2.  **Create a Docker volume:**
    ```bash
    docker volume create wow_volume
    ```

3.  **Run the MongoDB container:**
    ```bash
    docker run --name wowDBContainer --network wow_network -v wow_volume:/data/db -p 27017:27017 mongo
    ```

4.  **Run the Wow API container:**
    ```bash
    docker run -p 3000:3000 --network wow_network -e SECRET=YOUR_SECRET_KEY -e MONGO_CONNECTION_URL=mongodb://wowDBContainer:27017/wowLocal sameer99/wow-be
    ```

    **Important:**

    -   Replace `YOUR_SECRET_KEY` with a strong, secure secret.
    -   The `MONGO_CONNECTION_URL` is configured to connect to the `wowDBContainer` on the `wow_network`.
    -   The `sameer99/wow-be` image will be pulled from Docker Hub.

<!-- ### Docker Compose (Alternative)

1.  Create a `docker-compose.yml` file in the root directory:

    ```yaml
    version: '3.8'
    services:
      app:
        image: sameer99/wow-be
        ports:
          - "3000:3000"
        environment:
          JWT_SECRET: YOUR_SECRET_KEY
          MONGO_CONNECTION_URL: mongodb://db:27017/wowLocal
        networks:
          - wow_network
        depends_on:
          - db
      db:
        image: mongo:latest
        ports:
          - "27017:27017"
        volumes:
          - wow_volume:/data/db
        networks:
          - wow_network
    networks:
      wow_network:
    volumes:
      wow_volume:
    ```

2.  Run the application using Docker Compose:

    ```bash
    docker-compose up --build
    ```

    This will build the image (if not already present), create the network and volume, and start the application and MongoDB containers.

3. To stop the containers

    ```bash
    docker-compose down
    ``` -->

## Dependencies

-   `express`: Web framework for Node.js
-   `typescript`: TypeScript compiler
-   `mongoose`: MongoDB object modeling tool
-   `bcrypt`: Password hashing library
-   `jsonwebtoken`: JSON Web Token library
-   `cors`: Cross-origin resource sharing middleware
-   `dotenv`: Load environment variables from a `.env` file
-   `zod`: Schema validation library
-   `@types/*`: Type definitions for various libraries

## Project Structure

wow/
├── dist/             # Compiled JavaScript code
├── src/              # TypeScript source code
│   ├── index.ts      # Main application file
│   └── ...           # Other source files
├── .env              # Environment variables
├── package.json      # Project dependencies and scripts
├── tsconfig.json     # TypeScript configuration
├── Dockerfile        # Docker configuration (if building locally)
└── docker-compose.yml # Docker compose configuration