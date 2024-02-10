// no trailing slashes in API endpoints, please

const prod = {
  home: 'https://sagecontinuum.org',
  portal: 'https://portal.sagecontinuum.org',

  beehive: 'https://data.sagecontinuum.org/api/v1',
  beekeeper: 'https://api.sagecontinuum.org',
  ecr: 'https://ecr.sagecontinuum.org/api',
  es: 'https://es.sagecontinuum.org/api/v1',
  jenkins: 'https://ecr.sagecontinuum.org/jenkins',
  auth: 'https://auth.sagecontinuum.org',
  deviceRegistration:'https://registration.sagecontinuum.org',

  dockerRegistry: 'registry.sagecontinuum.org',
  influxDashboard: 'https://influxdb.sagecontinuum.org/orgs/6aa7e344b342bea3/dashboards',
  adminURL: 'https://admin.sagecontinuum.org',
  wifireData: 'https://wifire-data.sdsc.edu/api',
  dataDownload: 'https://sage-commons.sdsc.edu/sageinterface/dump',
  docs: 'https://sagecontinuum.org/docs',
  contactUs: 'https://sagecontinuum.org/docs/contact-us',
  ghDiscussions: 'https://github.com/orgs/waggle-sensor/discussions'
}


const dev = {
  ...prod,
  es: 'https://es-dev.sagecontinuum.org/api/v1',
  // ecr: 'https://sage-ecr-dev.sagecontinuum.org/api',
  // jenkins: 'https://jenkins-dev.sagecontinuum.org'
}


const config = {
  ...(process.env.SAGE_UI_SERVICE_CONFIG == 'dev' ? dev : prod),
  disableMaps: false,

  // temp solution for display names
  nodeSites: {
    W08D: 'NEIU',
    W099: 'NU',
    W08E: 'CSU'
  }
}


export default config
