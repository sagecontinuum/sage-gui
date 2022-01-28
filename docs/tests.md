# UI Testing

Note: test coverage is rather bare, but one can tests by simply running:

```
npm test
```

The testing framework is made up 3 core pieces:

- [Jest](https://jestjs.io/) is used for testing running
- [MSW](https://mswjs.io/) allows us to mock service requests/responses
- [React-testing-library](https://testing-library.com/docs/react-testing-library/intro) severs a few purposes:
  * some layers on top of jsdom to make querying and assertion a bit easier with a focus on accessibility
  * making integration with react easier
  * etc


File organization:

Config:

* `jest.config.js` jest configuration
* `jest.setup.js` any jest setup that is ran before running the suite of tests

Mocks:

* [__mocks__/](__mocks__/): any high-level pieces/components related to mocks that are often reused (such as `MockTheme.tsx`)
* [__mocks__/server.ts](__mocks__/server.ts): configuration for the Mock Service Worker (MSW)
* [sage/apis/ecr.mocks.ts](sage/apis/ecr.mocks.ts): mock data and MSW mock handlers

Test examples:

* [admin-ui/views/nodes/recentDataTable.test.tsx](admin-ui/views/nodes/__tests__/recentDataTable.tsx)
* [sage/ecr/app/app.text.tsx](sage/ecr/app/app.text.tsx)

