FROM node:20

WORKDIR /usr/src/app

COPY . .

RUN npm install -ws
RUN npm run build -ws

EXPOSE 4173
EXPOSE 5432
EXPOSE 8080

CMD ["concurrently", "npm:start"]
