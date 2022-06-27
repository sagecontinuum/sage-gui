FROM node:17-alpine
WORKDIR /appnpm
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json .
RUN npm install --legacy-peer-deps
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
