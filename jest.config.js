const config = {
  setupFiles: ['./jest.setup.js'],
  roots: ['<rootDir>'],
  moduleFileExtensions: ['ts', 'js', 'jsx', 'tsx'],
  collectCoverage: true,
  clearMocks: true,
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '^~/(.*)': '<rootDir>/$1',
    '^/(.*)': '<rootDir>/$1',
  },
  modulePathIgnorePatterns: [
    'apps/registration-api/'
  ],
  testPathIgnorePatterns: [
    `components/_example`
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(d3|d3-.*)/)'
  ]
}

module.exports = config