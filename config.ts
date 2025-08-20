// no trailing slashes in API endpoints, please

const prod = {
  home: 'https://sagecontinuum.org',           // used for "home" of other apps
  portal: 'https://portal.sagecontinuum.org',  // uised for PortalLink component

  // endpoints
  beehive: 'https://data.sagecontinuum.org/api/v1',
  beekeeper: 'https://api.sagecontinuum.org',
  ecr: 'https://ecr.sagecontinuum.org/api',
  es: 'https://es.sagecontinuum.org/api/v1',
  jenkins: 'https://ecr.sagecontinuum.org/jenkins',
  auth: 'https://auth.sagecontinuum.org',
  deviceRegistration:'https://registration.sagecontinuum.org',
  experimentalData:'https://portal.sagecontinuum.org/experimental-data',

  // links
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
  auth: 'http://0.0.0.0:8000',
  // es: 'https://es-dev.sagecontinuum.org/api/v1',
  // ecr: 'https://sage-ecr-dev.sagecontinuum.org/api',
  // jenkins: 'https://jenkins-dev.sagecontinuum.org'
}


type Notice = {
  message: string,
  severity: 'info' | 'warning' | 'error' | 'success'
}

type Config = {
  [key: string]: string | boolean | Notice
  disableMaps: boolean
  notice?: Notice
  noticeURL?: string // optional URL to fetch notice from
}

const config: Config = {
  ...(process.env.SAGE_UI_SERVICE_CONFIG == 'dev' ? dev : prod),
  disableMaps: false,
  noticeURL: 'https://raw.githubusercontent.com/waggle-sensor/portal-notice/main/notice.json'
  /*
  notice: {
    message:
      'Node measurements, system status, and the Data API may be intermittently ' +
      'unavailable throughout Wednesday and Thursday, August 20th and 21st.',
    severity: 'warning'
  },
  */
}


export default config
export type { Notice }
