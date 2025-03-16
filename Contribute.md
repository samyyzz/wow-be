# Manual Installation

- Install Nodejs
- Clone the repo
- Install dependencies (npm i)
- Start the DB locally
  - docker run --name wowDBContainer --network wow_Network -v wow_Volume:/data/db -p 27017:27017 -d mongodb
  - setup .env and update your MONGO_CONNECTION_URL
  - mongodb://wowDBContainer:27017/mongoLocal
- npm run build
- npm run start

# Docker Installation Setup

- Install Docker
- Start Mongo locally:
  - docker create network wow_Network
  - docker create volume wow_Volume
  - `docker run --name wowDBContainer --network wow_Network -v wow_Volume:/data/db -p 27017:27017 -d mongodb`
- Build Image: `docker build -t wow-be .`
- Run Image:` docker run --name wow_be --network wow_Network -p 3000:3000 wow-be`

# Docker-compose Installation Setup (recommended)

- Install Docker, Docker compose
- Run `docker-compose up`
