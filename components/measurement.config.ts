import settings from '/components/settings'

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
      {name: 'wxt.env.pressure', label: 'Pressure'},
      {name: 'wxt.rain.accumulation', label: 'Rain Accum.'},
      {name: 'wxt.hail.accumulation', label: 'Hail Accum.'},
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
      {name: 'env.air_quality.conc', label: 'Air Quality', units: 'mg/m³'},
      {name: 'env.air_quality.flow', label: 'Air Flow'}
    ],
    sensor: 'es642'
  },

  'LI-7500DS': {
    start: '-1h',
    names: [
      {name: 'co2.absolute_water', },
      {name: 'co2.absolute_water_offset', },
      {name: 'co2.density', },
      {name: 'co2.mg_per_m3', },
      {name: 'co2.mole_fraction', },
      {name: 'co2.raw', },
      {name: 'co2.signal_strength', },
      {name: 'dew_point', },
      {name: 'h2o.absolute_water', },
      {name: 'h2o.absolute_water_offset', },
      {name: 'h2o.density', },
      {name: 'h2o.g_per_m3', },
      {name: 'h2o.mole_fraction', },
      {name: 'h2o.raw', },
      {name: 'pressure', },
      {name: 'sonic.speed_of_sound', },
      {name: 'sonic.temperature', },
      {name: 'sonic.u', },
      {name: 'sonic.v', },
      {name: 'sonic.w', },
      {name: 'temperature', },
      // {name: 'index', },
      // {name: 'cooler', },
      // {name: 'date', },
      // {name: 'index', },
      // {name: 'time', label: '____'},
      // {name: 'time.nanoseconds', label: '____'},
      // {name: 'time.seconds', label: '____'},
    ],
    sensor: 'LI7500DS/uSonic-3'
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
  'hits per square centimeter': 'hits / cm²',
  'hectoPascal': 'hPa',
  'mg/m^3': 'mg/m²',
  'unit': ' '  // don't show "unit"; artifact of LI-7500DS
}

let skipSensorPreview = [
  'microphone',
  'gps',
  'bme280',
]

if (settings.project == 'CROCUS')
  skipSensorPreview = [...skipSensorPreview, 'bme680']


export {
  measurements,
  shortUnits,
  skipSensorPreview
}