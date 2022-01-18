module.exports = {
  setupFiles: ['./jest.setup.js'],
  roots: ['<rootDir>'],
  moduleFileExtensions: ['ts', 'js', 'jsx', 'tsx'],
  collectCoverage: true,
  clearMocks: true,
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/jest/svgMock.js"
  }
}