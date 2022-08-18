
// no trailing slashes in endpoints, please

const config = {
  // api endpoints
  beehive: 'https://data.sagecontinuum.org/api/v1',
  beekeeper: 'https://api.sagecontinuum.org',
  ecr: 'https://ecr.sagecontinuum.org/api',
  jenkins: 'https://ecr.sagecontinuum.org/jenkins',
  ses: 'https://portal.sagecontinuum.org/ses-plugin-data',
  auth: 'https://auth.sagecontinuum.org',
  deviceRegistration:'http://localhost:3001/register',

  dockerRegistry: 'registry.sagecontinuum.org',
  influxDashboard: 'https://influxdb.sagecontinuum.org/orgs/6aa7e344b342bea3/dashboards',
  dataBrowserURL: 'https://portal.sagecontinuum.org/data-browser',
  adminURL: 'https://admin.sagecontinuum.org',
  sageCommons: 'https://wifire-data.sdsc.edu/api',
  dataDownload: 'https://sage-commons.sdsc.edu/sageinterface/dump',
  docs: 'https://docs.waggle-edge.ai/docs',

  disableMaps: false,

  // temp solution for additional meta
  additional_sensors: {
    'W022': [
      'OS0-64-GEN2.0 Gen2 64 Below Horizon',
      'ORTEC digiBASE PMT with NaI detector'
    ],
    'W01A': [
      'OS0-64-GEN2.0 Gen2 64 Below Horizon',
      'ORTEC digiBASE PMT with NaI detector'
    ],
    'W01B': [
      'OS0-64-GEN2.0 Gen2 64 Below Horizon',
      'ORTEC digiBASE PMT with NaI detector'
    ],
    'W01C': [
      'OS0-64-GEN2.0 Gen2 64 Below Horizon',
      'ORTEC digiBASE PMT with NaI detector'
    ],
    'W027': [
      'Met One ES-642'
    ],
    'W038': [
      'Met One ES-642'
    ],
    'V008': [
      'Mobotix M16'
    ]
  }
}

export default config

export const hasMetOne = (vsn) => {
  const sensors = config.additional_sensors
  const nodes = Object.keys(sensors).filter(k => sensors[k].includes('Met One ES-642'))
  return nodes.includes(vsn)
}
