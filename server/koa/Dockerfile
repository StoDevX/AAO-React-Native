FROM docker.io/node:9-alpine

RUN apk add -U curl

WORKDIR /app
ADD ./package.json /app
ADD ./package-lock.json /app

RUN npm install --production

HEALTHCHECK --interval=20s --timeout=1s \
  CMD curl -f http://localhost:3001/ping

ADD . /app

CMD env NODE_ENV=production NODE_PORT=3001 node ./index.js 
