FROM node:16

EXPOSE 8082

COPY package.json /app/
RUN cd /app && npm install
COPY . /app
WORKDIR /app
RUN ls -lah

CMD npm run start