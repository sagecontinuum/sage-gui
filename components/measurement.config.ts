// default start time ("start") is '-24h'

const measurements = {
  'AQT530': {
    names: [
      {name: 'aqt.env.temp', label: 'Temperature'},
      {name: 'aqt.env.humidity', label: 'Humidity'},
      {name: 'aqt.env.pressure', label: 'Pressure'},
      {name: 'aqt.gas.co', label: 'co'},
      {name: 'aqt.gas.no', label: 'no'},
      {name: 'aqt.gas.no2', label: 'no2'},
      {name: 'aqt.gas.ozone', label: 'ozone'},
      // {name: 'aqt.house.datetime'}
      // {name: 'aqt.house.uptime'}
      {name: 'aqt.particle.pm1', label: 'pm1'},
      {name: 'aqt.particle.pm2.5', label: 'pm2.5'},
      {name: 'aqt.particle.pm10', label: 'pm10'}
    ]
  },
  'WXT536': {
    start: '-1h',
    names: [
      {name: 'wxt.env.temp', label: 'Temperature'},
      {name: 'wxt.env.humidity', label: 'Humidity'},
      {name: 'wxt.env.presure', label: 'Presure'},
      {name: 'wxt.rain.accumulation', label: 'Rain'},
      {name: 'wxt.hail.accumulation', label: 'Hail'},
      {name: 'wxt.wind.direction', label: 'Wind Direction'},
      {name: 'wxt.wind.speed', label: 'Wind Speed'}
    ]
  },

  'BME680': {
    names: [
      {name: 'env.temperature', label: 'Temperature', units: '°C'},
      {name: 'env.relative_humidity', label: 'Humidity', units: '%'},
      {name: 'env.pressure', label: 'Pressure', units: 'Pa'},
    ],
    sensor: 'bme680'
  },
  'RG-15': {
    names: [
      {name: 'env.raingauge.event_acc', label: 'Rainfall', units: 'mm'}
    ]
  },

  'ES-642': {
    names: [
      {name: 'env.temperature', label: 'Temperature', units: '°C'},
      {name: 'env.relative_humidity', label: 'Humidity', units: '%'},
      {name: 'env.pressure', label: 'Pressure', units: 'Pa'},
      {name: 'env.air_quality.conc', label: 'Air Quality', units: 'μg/m³'},
      {name: 'env.air_quality.flow', label: 'Air Flow'}
    ],
    sensor: 'es642'
  }
}

const shortUnits = {
  'microgram per cubic meter': 'μg/m³',
  'percent relative humidity': 'RH',
  'percent': '%',
  'ppm': 'PPM',
  'degrees Celsius': '°C', // AQT530 `meta.units`
  'degree Celsius': '°C',  // WXT536 `meta.units`
  'degrees': '°',
  'milimeters': 'mm',
  'meters per second': 'm/s',
}

const skipSensorPreview = [
  'microphone',
  'gps',
  'bme280',
]


export {
  measurements,
  shortUnits,
  skipSensorPreview
}