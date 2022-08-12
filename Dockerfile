# build
FROM node:14.16 AS build
ENV MAPBOX_TOKEN=${MAPBOX_TOKEN}
WORKDIR /app
COPY . .
#RUN npm install -s --production
#RUN npm run build-admin

# server
FROM nginx:1.18-alpine
ARG SAGE_UI_APP
WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=build /app/apps/${SAGE_UI_APP}/dist/ /var/www/
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

ENTRYPOINT ["nginx", "-g", "daemon off;"]