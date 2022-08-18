FROM waggle/beekeeper-key-tools
WORKDIR /registration-api
ADD . /registration-api
RUN apt-get install curl -y && curl -sL https://deb.nodesource.com/setup_16.x | bash
RUN apt-get install -y nodejs
RUN npm install
EXPOSE 3001
ENV NODE_ENV production
ENV tokenInfoPassword=${tokenInfoPassword}
CMD [ "node", "RegistrationApi.js"]