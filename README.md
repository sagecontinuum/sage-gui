# sage-gui

React.js components for the Sage Admin UI and more.


## Docker Quick Start

Build/run:

```
export MAPBOX_TOKEN=<token_string>
docker build --build-arg MAPBOX_TOKEN -t sage-admin-ui .
docker run -dp 8080:80 sage-admin-ui
```


## Development

Requires [node.js](https://nodejs.org) v14+

Clone, then:

```
npm install
```

Start the development server:
```
npm run start-admin
```


## Dev Mapbox token

If you want to use mapbox:
```
export MAPBOX_TOKEN=<token_string>
npm run start-admin
```


### Legacy testing

Run the following to fetch the test data manifest, do some column renaming, and save as `test-data/blades.json`:

```
./scripts/get-mock-data.sh test-data/blades.json
```

Start server for mock data:
```
npm run mock-beekeeper
```

Start the development server:
```
npm run start-admin
```


## Build

To create a build in `dist/` using [parcel](https://parceljs.org/) v2:

```
npm run build-admin
```
