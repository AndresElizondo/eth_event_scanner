FROM node:lts-slim

WORKDIR /data_loader
COPY package.json package-lock.json ./
RUN npm i
COPY source/ ./source
COPY index.js config.json ./

ENTRYPOINT ["npm", "start"]
