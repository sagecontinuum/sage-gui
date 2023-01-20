# UI Testing

Run tests by simply running:

```
npm test
```

To run in "watch" mode:

```
npm test -- --watch
```

To run a particular set of tests (without using the "watch" prompts):

```
npm test -- path/to/some.test.tsx
```

## Tooling

The testing framework is made up 3 core pieces:

- [Jest](https://jestjs.io/) is used for testing running
- [MSW](https://mswjs.io/) allows us to mock service requests/responses
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro) serves a few purposes:
  * "The more your tests resemble the way your software is used, the more confidence they can give you" --Testing Library
  * The addition of layers on top of jsdom to make querying and assertion easier, and with some focus on accessibility
  * Making integration with react easier
  * etc


## File Organization

Config:

* `jest.config.js` jest configuration
* `jest.setup.js` any jest setup that is ran before running the suite of tests

Mocks:

* [/\__mocks__/](../__mocks__/): any high-level pieces/components related to mocks which are often reused (such as `MockTheme.tsx`)
* [/\__mocks__/server.ts](/__mocks__/server.ts): configuration for the Mock Service Worker (MSW)
* [/components/apis/ecr.mocks.ts](/components/apis/ecr.mocks.ts): mock data and MSW mock handlers

Example Test Code:

* [/components/views/recentDataTable.test.tsx](/components/views/recentDataTable.test.tsx)
* [/apps/sage/ecr/app/app.test.tsx](/apps/sage/ecr/app/app.test.tsx)

