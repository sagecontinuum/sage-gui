
// no trailing slashes in endpoints, please

export default  {
  // api endpoints
  beehive: 'https://data.sagecontinuum.org/api/v1',
  beekeeper: 'https://api.sagecontinuum.org',
  ecr: 'https://ecr.sagecontinuum.org/api',
  jenkins: 'https://ecr.sagecontinuum.org/jenkins',
  ses: 'https://portal.sagecontinuum.org/ses-plugin-data',
  auth: 'https://auth.sagecontinuum.org',

  dockerRegistry: 'registry.sagecontinuum.org',
  influxDashboard: 'https://influxdb.sagecontinuum.org/orgs/6aa7e344b342bea3/dashboards',
  dataBrowserURL: 'https://portal.sagecontinuum.org/data-browser',
  sageCommons: 'https://sage-commons.sdsc.edu/api',
  dataDownload: 'https://sage-commons.sdsc.edu/sageinterface/dump',

  docs: 'https://docs.sagecontinuum.org/docs',

  // temp solution for additonal meta
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
    'V008': [
      'Mobotix M16'
    ]
  }

}