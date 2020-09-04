#!/bin/bash
if [ "$NODE_ENV" = "production" ]; then
    npm install --only=prod && npm run build
else
    npm install && npm start
fi