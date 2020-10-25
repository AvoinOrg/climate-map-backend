#!/bin/bash
if [ "$NODE_ENV" = "production" ]; then
    yarn install --only=prod && yarn run build && node server;
else
    yarn install && yarn start;
fi