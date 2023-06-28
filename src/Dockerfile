FROM node:18

ENV JWT_SECRET=${JWT_SECRET}

RUN apt-get update && apt-get install gdal-bin -y

RUN mkdir -p /home/node/app/node_modules

WORKDIR /home/node/app

COPY package*.json ./
COPY docker-entrypoint.sh ./

RUN chown -R node:node /home/node/app

USER node

EXPOSE 8080

ENTRYPOINT ["/bin/bash", "/home/node/app/docker-entrypoint.sh"]

