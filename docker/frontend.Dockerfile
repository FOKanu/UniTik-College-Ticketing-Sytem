# Development image for the frontend Vite dev server.
# TODO: add a static multi-stage production build (nginx) before deployment.
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
