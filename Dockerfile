# build
FROM node:14.16 AS build
WORKDIR /app
COPY . .
RUN npm install -s
RUN npm run build

# server
FROM nginx:1.18-alpine
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=build /app/dist/ /var/www/
COPY --from=build /app/test-data/* /var/www/
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

ENTRYPOINT ["nginx", "-g", "daemon off;"]