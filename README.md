# sage-gui

React.js components for the Sage Admin UI and more.


## Installation

Requires [node.js](https://nodejs.org) v14+

Clone, then:

```
npm install
```

## Development

Test data is currently needed for development.  Run the following to fetch the manifest, do some column renaming, and save as `test-data/blades.json`:

```
./scripts/get-mock-data.sh test-data/blades.json
```

Start server for mock data:
```
npm run mock-beekeeper
```

Start the development server:
```
npm start
```

## Build

To create a build in `dist/` using [parcel](https://parceljs.org/) v2:

```
npm run build
```


## Notes
If you are moving or renaming files, such as changing a file from `.js`/`.jsx` to `.ts`/`.tsx`, parcel will sometimes get confused.
To clear `.parcel-cache/` and `build/`, run:

```
npm run clean
npm start
```


