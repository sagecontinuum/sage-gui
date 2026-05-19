# build
FROM node:24-alpine AS build
ARG SAGE_UI_APP=sage
ARG SAGE_UI_PROJECT
ARG SAGE_UI_SERVICE_CONFIG
ARG MAPBOX_TOKEN

ENV SAGE_UI_PROJECT=${SAGE_UI_PROJECT}
ENV SAGE_UI_SERVICE_CONFIG=${SAGE_UI_SERVICE_CONFIG}
ENV MAPBOX_TOKEN=${MAPBOX_TOKEN}

WORKDIR /app
COPY apps/${SAGE_UI_APP}/package.json ./apps/${SAGE_UI_APP}/package.json
COPY package*.json .
RUN npm install -g npm@11.14.1
RUN npx update-browserslist-db@latest
RUN npm install -w ${SAGE_UI_APP} --omit=dev
COPY . .

RUN npm run build -w ${SAGE_UI_APP}

# server
FROM nginx:stable-alpine
ARG SAGE_UI_APP=sage

WORKDIR /usr/share/nginx/html
RUN rm -rf ./*
COPY --from=build /app/apps/${SAGE_UI_APP}/dist/ /var/www/
COPY ./nginx.conf /etc/nginx/conf.d/default.conf

ENTRYPOINT ["nginx", "-g", "daemon off;"]