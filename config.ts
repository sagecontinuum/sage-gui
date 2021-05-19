
// no trailing slashes in endpoints, please

export default  {
  // api end points
  beehive: 'https://sdr.sagecontinuum.org/api/v1',
  beekeeper: 'https://beekeeper.honeyhouse.one/api',
  ecr: 'https://ecr.sagecontinuum.org/api',   // 'http://localhost:5000'
  jenkins: 'https://ecr.sagecontinuum.org/jenkins',

  auth: 'https://sage.nautilus.optiputer.net/',

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

  // temp ui display name (for admin ui)
  user: {
    username: 'testuser'
  }
}
