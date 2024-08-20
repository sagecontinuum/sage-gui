// default start time ("start") is '-24h'

const measurements = {
  'AQT530': {
    names: [
      'aqt.env.temp',
      'aqt.env.humidity',
      'aqt.env.pressure',
      'aqt.gas.co',
      'aqt.gas.no',
      'aqt.gas.no2',
      'aqt.gas.ozone',
      // 'aqt.house.datetime'',
      // 'aqt.house.uptime'',
      'aqt.particle.pm1',
      'aqt.particle.pm2.5',
      'aqt.particle.pm10',
    ]
  },
  'WXT536': {
    start: '-1h',
    names: [
      'wxt.env.humidity',
      'wxt.env.presure',
      'wxt.env.temp',
      'wxt.rain.accumulation',
      'wxt.hail.accumulation',
      'wxt.wind.direction',
      'wxt.wind.speed'
    ]
  }
}

const shortUnits = {
  'microgram per cubic meter': 'μg/m³',
  'percent relative humidity': 'RH',
  'percent': '%',
  'ppm': 'PPM',
  'degree Celsius': '°C',
  'degrees': '°',
  'milimeters': 'mm',
  'meters per second': 'm/s',
}


export {
  measurements,
  shortUnits
}