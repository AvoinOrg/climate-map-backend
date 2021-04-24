#!/bin/sh
git pull
docker-compose down
docker-compose -f docker-compose-prod.yml up --build -d
