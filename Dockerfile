FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm run build && npm run migrate
CMD ["npm", "start"]