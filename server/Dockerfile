FROM docker.io/node:9-alpine

WORKDIR /app
ADD . /app

RUN npm install --production

CMD env NODE_ENV=production ./node_modules/.bin/nodemon ./node_modules/.bin/micro
