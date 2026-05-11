FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY src ./src
RUN mkdir -p storage/uploads storage/reports

EXPOSE 5000

CMD ["npm", "start"]
