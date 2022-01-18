module.exports = {
  setupFiles: ['./jest.setup.js'],
  roots: ['<rootDir>'],
  moduleFileExtensions: ['ts', 'js', 'jsx', 'tsx'],
  collectCoverage: true,
  clearMocks: true,
  coverageDirectory: 'coverage'
}