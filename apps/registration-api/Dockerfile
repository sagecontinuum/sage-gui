FROM waggle/beekeeper-key-tools
WORKDIR /registration-api
ADD . /registration-api
# RUN apt-get install curl && curl -sL https://deb.nodesource.com/setup_16.x | bash
RUN apt-get install nodejs -y
RUN apt-get update && apt-get install npm -y
RUN npm install 
EXPOSE 5000
ENV NODE_ENV production
CMD [ "node", "RegistrationApi.js"]