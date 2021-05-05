
// no trailing slashes in endpoints, please

export default  {
  // api end points
  beehive: 'https://sdr.honeyhouse.one/api/v1',
  beekeeper: 'https://beekeeper.honeyhouse.one/api',
  ecr: 'https://ecr.sagecontinuum.org/api',   // 'http://localhost:5000'

  // ui configuration
  ui: {
    activityLength: 50,     // number of data points for ticker
    hostSuffixMapping: {    // mapping for host suffix to short names (displayed in UI)
      'ws-rpi': 'rpi',
      'ws-nxcore': 'nx',
      'ws-nxagent': 'nxagent'
    },
    disableMap: false
  },

  // temp/testing configuration
  user: {
    username: 'testuser'
  }
}
