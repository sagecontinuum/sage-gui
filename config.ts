
// no trailing slashes in endpoints, please

export default  {
  // api endpoints
  beehive: 'https://data.sagecontinuum.org/api/v1',
  beekeeper: 'https://api.sagecontinuum.org/api',
  ecr: 'https://ecr.sagecontinuum.org/api',
  jenkins: 'https://ecr.sagecontinuum.org/jenkins',
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
    ignoreList: [
      '0000000000000001', '000048B02D059C6A', '000048B02D07627C',
      '000048B02D0766CD', '000048B02D15BC65', '000048B02D15C1AA',
      '000048B02D15D52F', 'SURYALAPTOP00000'
    ],
    disableMap: false
  }
}
