# climate-map-backend

### Tests
The server has endpoint/integration tests that utilize the Postgres test database.  
The test commands need to be run within the docker container:
        
    docker exec -it climate-map-node yarn test
    docker exec -it climate-map-node yarn test:watch