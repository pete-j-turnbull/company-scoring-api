FROM nodesource/precise:4.3.0

RUN apt-get update
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

ADD package.json package.json
RUN npm install

ADD . .

ENV NODE_ENV production

EXPOSE 5000

CMD ["npm", "start"]
