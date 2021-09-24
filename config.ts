
// no trailing slashes in endpoints, please

export default  {
  // api endpoints
  beehive: 'https://data.sagecontinuum.org/api/v1',
  beekeeper: 'https://api.sagecontinuum.org/api',
  ecr: 'https://ecr.sagecontinuum.org/api',
  jenkins: 'https://ecr.sagecontinuum.org/jenkins',
  ses: 'https://portal.sagecontinuum.org/ses-plugin-data',
  auth: 'https://auth.sagecontinuum.org',
  sageCommons: 'https://sage-commons.sdsc.edu/api',
  dataDownload: 'https://sage-commons.sdsc.edu/sageinterface/dump',

  // ui configuration (for admin ui)
  admin: {
    activityLength: 50,     // number of data points for ticker
    hostSuffixMapping: {    // mapping for host suffix to short names (displayed in UI)
      'ws-rpi': 'rpi',
      'ws-nxcore': 'nx',
      'ws-nxagent': 'nxagent'
    },
    disableMap: false
  }
}
