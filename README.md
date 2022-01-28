# sage-gui

React.js components for Sage UIs.


## Installation

Requires [node.js](https://nodejs.org) v14+

Clone this repo, `cd` to that directory, and run:

```
npm install
```


## Development

### Admin UI

To start the Admin UI dev server:
```
npm run start-admin
```


### Sage UI

To start the Sage UI dev server:
```
npm run start
```


## Builds

Builds are done using [parcel](https://parceljs.org/) v2.

### Admin UI

To create an Admin UI build in `dist/`:

```
npm run build-admin
```

### Sage UI

To create an Sage UI build in `dist/`:

```
npm run build
```


#### Notes

If you want to use mapbox, you can use a local env variable `MAPBOX_TOKEN`.

Example:

```
export MAPBOX_TOKEN=<token_string>
npm run start-admin
```


### Tests

Run tests using
```
npm test
```

Read more about tests [here]()


## Changelog

[Changelog](https://github.com/sagecontinuum/sage-gui/blob/main/CHANGELOG.md)


## Docker

*NOTE*: there is currently a bug in this docker flow!

Build/run:

```
export MAPBOX_TOKEN=<token_string>
docker build --build-arg MAPBOX_TOKEN -t sage-admin-ui .
docker run -dp 8080:80 sage-admin-ui
```

