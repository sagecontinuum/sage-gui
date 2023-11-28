# sage-gui

React.js components for Sage UIs.


## Installation

Requires [node.js](https://nodejs.org) (v18.17.0+ recommended).

Clone this repo, `cd` to that directory, and run:

```
npm install
```


## Development

Start a dev server:
```
npm start
```

> You can start a dev server for a different app with `npm start -w <app>`.  For example, `npm start -w project`

#### Pre-commit hook

Before committing code, please configure pre-commit linting and type checking:

```
git config --local core.hooksPath .githooks
```

If using vscode, it is also recommended to install [vscode-eslint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint).


## Builds

```
npm run build -w sage
```
> or, `npm run build -w <app>`


## Notes

#### Project pages

The [config](./components/settings.ts) for a project page is controlled with the env variable `SAGE_UI_PROJECT`.  I.e.,

```
export SAGE_UI_PROJECT=CROCUS
npm start -w project
```

#### Third-party tokens

To use [Mapbox](https://www.mapbox.com/), you can use a local env variable `MAPBOX_TOKEN`:

```
export MAPBOX_TOKEN=<token_string>
npm start
```


## Tests

Run tests using
```
npm test
```

Read more about tests [here](/docs/ui-testing.md).


## Changelog

[Changelog](https://github.com/sagecontinuum/sage-gui/blob/main/CHANGELOG.md)


## Docker

Simple build/run example:

```
docker build -t sage-ui .
docker run -dp 8080:80 sage-ui
```

Passing a build arg variable:

```
docker build --build-arg MAPBOX_TOKEN=<token_string> -t sage-ui .
docker run -dp 8080:80 sage-ui
``````

