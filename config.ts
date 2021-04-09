
// no trailing slashes in endpoints, please

export default  {
  // api end points
  beehive: 'https://sdr.honeyhouse.one/api/v1',
  beekeeper: 'https://beekeeper.honeyhouse.one/api',
  ecr: 'http://localhost:5000',

  // ui configuration
  ui: {
    // number of data points for ticker
    activityLength: 50,
    // mapping for host suffix to short names (displayed in UI)
    hostSuffixMapping: {
      'ws-rpi': 'rpi',
      'ws-nxcore': 'nx'
    },
    disableMap: true
  },

  // temp/testing configuration
  user: {
    username: 'testuser'
  }
}
