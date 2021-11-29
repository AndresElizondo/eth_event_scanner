FROM node:lts-slim

WORKDIR /listener
COPY package.json package-lock.json ./
RUN npm i
COPY source/ ./source
COPY listen.js ./
ENTRYPOINT ["npm", "start"]
