# climate-map-backend

Backend for [Climate Map](https://github.com/avoinorg/climate-map)

### Running
Requires Docker. Create an .env file (see .env.example) and run with

        docker-compose up --build

### Tests
The server has endpoint/integration tests that utilize the Postgres test database.  
The test commands need to be run within the docker container:
        
    docker exec -it climate-map-node yarn test
    docker exec -it climate-map-node yarn test:watch

### Production

In .env file, set

        NODE_ENV=production

and run

        docker-compose -f docker-compose-prod.yml up --build -d