import settings from '/components/settings'

const measurements = {
  AQT530: {
    names: [
      { name: 'aqt.env.temp', label: 'Temperature' },
      { name: 'aqt.env.humidity', label: 'Humidity' },
      { name: 'aqt.env.pressure', label: 'Pressure' },
      { name: 'aqt.gas.co', label: 'co' },
      { name: 'aqt.gas.no', label: 'no' },
      { name: 'aqt.gas.no2', label: 'no2' },
      { name: 'aqt.gas.ozone', label: 'ozone' },
      // {name: 'aqt.house.datetime'}
      // {name: 'aqt.house.uptime'}
      { name: 'aqt.particle.pm1', label: 'pm1' },
      { name: 'aqt.particle.pm2.5', label: 'pm2.5' },
      { name: 'aqt.particle.pm10', label: 'pm10' },
    ],
  },

  WXT536: {
    start: '-1h',
    names: [
      { name: 'wxt.env.temp', label: 'Temperature' },
      { name: 'wxt.env.humidity', label: 'Humidity' },
      { name: 'wxt.env.pressure', label: 'Pressure' },
      { name: 'wxt.rain.accumulation', label: 'Rain Accum.' },
      { name: 'wxt.hail.accumulation', label: 'Hail Accum.' },
      { name: 'wxt.wind.direction', label: 'Wind Direction' },
      { name: 'wxt.wind.speed', label: 'Wind Speed' },
    ],
  },

  BME680: {
    names: [
      { name: 'env.temperature', label: 'Temperature', units: '°C' },
      { name: 'env.relative_humidity', label: 'Humidity', units: '%' },
      { name: 'env.pressure', label: 'Pressure', units: 'Pa' },
    ],
    sensor: 'bme680',
  },

  'RG-15': {
    names: [
      { name: 'env.raingauge.event_acc', label: 'Rainfall', units: 'mm' },
    ],
  },

  'ES-642': {
    names: [
      { name: 'env.temperature', label: 'Temperature', units: '°C' },
      { name: 'env.relative_humidity', label: 'Humidity', units: '%' },
      { name: 'env.pressure', label: 'Pressure', units: 'Pa' },
      { name: 'env.air_quality.conc', label: 'Air Quality', units: 'mg/m³' },
      { name: 'env.air_quality.flow', label: 'Air Flow' },
    ],
    sensor: 'es642',
  },

  'LI-7500DS': {
    start: '-1h',
    names: [
      { name: 'co2.absolute_water' },
      { name: 'co2.absolute_water_offset' },
      { name: 'co2.density' },
      { name: 'co2.mg_per_m3' },
      { name: 'co2.mole_fraction' },
      { name: 'co2.raw' },
      { name: 'co2.signal_strength' },
      { name: 'dew_point' },
      { name: 'h2o.absolute_water' },
      { name: 'h2o.absolute_water_offset' },
      { name: 'h2o.density' },
      { name: 'h2o.g_per_m3' },
      { name: 'h2o.mole_fraction' },
      { name: 'h2o.raw' },
      { name: 'pressure' },
      { name: 'sonic.speed_of_sound' },
      { name: 'sonic.temperature' },
      { name: 'sonic.u' },
      { name: 'sonic.v' },
      { name: 'sonic.w' },
      { name: 'temperature' },
      // {name: 'index', },
      // {name: 'cooler', },
      // {name: 'date', },
      // {name: 'index', },
      // {name: 'time', label: '____'},
      // {name: 'time.nanoseconds', label: '____'},
      // {name: 'time.seconds', label: '____'},
    ],
    sensor: 'LI7500DS/uSonic-3',
  },

  SFM1x: {
    // lora device
    names: [
      {
        name: 'uncorrected_inner|uncorrected_outer',
        label: 'Uncorrected Inner/Outer',
      },
    ],
  },

  MPU6050: {
    names: [
      { name: 'env.pitch.hut', label: 'Hut Pitch' },
      { name: 'env.roll.hut', label: 'Hut Roll' },
      { name: 'env.yaw.hut', label: 'Hut Yaw' },
    ],
  },

  AHT21: {
    names: [
      { name: 'env.humidity.hut', label: 'Hut Humidity' },
      { name: 'env.temperature.hut', label: 'Hut Temperature' },
    ],
  },

  'GS-MPPT-60': {
    names: [
      { name: 'env.solar.current.array', label: 'array' },
      { name: 'env.solar.current.load', label: 'load' },
      { name: 'env.solar.current.system.battery', label: 'system.battery' },
      { name: 'env.solar.current.system.charging', label: 'system.charging' },
      { name: 'env.solar.current.system.load', label: 'system.load' },
      { name: 'env.solar.state.charging', label: 'state.charging' },
      { name: 'env.solar.state.load', label: 'state.load' },
      { name: 'env.solar.temperature.battery', label: 'temperature.battery' },
      { name: 'env.solar.temperature.heatsink', label: 'temperature.heatsink' },
      { name: 'env.solar.voltage.array', label: 'voltage.array' },
      { name: 'env.solar.voltage.battery', label: 'voltage.battery' },
      {
        name: 'env.solar.voltage.battery.sense',
        label: 'voltage.battery.sense',
      },
      { name: 'env.solar.voltage.load', label: 'voltage.load' },
    ],
  },

  'EXO_sonde': {
    names: [
      // { name: 'battery', label: 'Battery' },
      // { name: 'conductivity', label: 'Conductivity' },
      { name: 'device_id' },
      // { name: 'env_battery_v', label: 'Env_battery_v' },
      // { name: 'env_conductivity_ms_cm', label: 'Env_conductivity_ms_cm' },
      { name: 'env_conductivity_us_cm'},
      { name: 'env_external_power_v' },
      // { name: 'env_fdom_qsu', label: 'Env_fdom_qsu' },
      { name: 'env_fdom_rfu' },
      // { name: 'env_nlf_conductivity_ms_cm', label: 'Env_nlf_conductivity_ms_cm' },
      // { name: 'env_nlf_conductivity_us_cm', label: 'Env_nlf_conductivity_us_cm' },
      // { name: 'env_odo__sat', label: 'Env_odo__sat' },
      // { name: 'env_odo__satlocal', label: 'Env_odo__satlocal' },
      { name: 'env_odo_mg_l' },
      // { name: 'env_salinity_ppt', label: 'Env_salinity_ppt' },
      { name: 'env_sampling_period' },
      // { name: 'env_specific_conductance_ms_cm', label: 'Env_specific_conductance_ms_cm' },
      // { name: 'env_specific_conductance_us_cm', label: 'Env_specific_conductance_us_cm' },
      { name: 'env_temperature_c' },
      // { name: 'env_temperature_f', label: 'Env_temperature_f' },
      // { name: 'env_temperature_k', label: 'Env_temperature_k' },
      // { name: 'env_wiper_peak_current_ma', label: 'Env_wiper_peak_current_ma' },
      // { name: 'env_wiper_position_v', label: 'Env_wiper_position_v' },
      // { name: 'external_power', label: 'External_power' },
      // { name: 'fdom', label: 'Fdom' },
      // { name: 'nlf_conductivity', label: 'Nlf_conductivity' },
      // { name: 'odo', label: 'Odo' },
      // { name: 'raw_payload', label: 'Raw_payload' },  <!----- reporting recently, but hidden
      // { name: 'salinity', label: 'Salinity' },
      // { name: 'sampling_period', label: 'Sampling_period' },
      // { name: 'signal.pl', label: 'Pl' },
      // { name: 'signal.rssi', label: 'Rssi' },
      // { name: 'signal.snr', label: 'Snr' },
      // { name: 'signal.spreadingfactor', label: 'Spreadingfactor' },
      // { name: 'specific_conductance', label: 'Specific_conductance' },
      // { name: 'temperature', label: 'Temperature' },
      { name: 'version' },
      // { name: 'wiper_peak_current', label: 'Wiper_peak_current' },
      // { name: 'wiper_position', label: 'Wiper_position' },
    ],
  },

  'MFR_node': {
    names: [
      { name: 'air_temperature', label: 'Air Temp' },
      { name: 'barometric_pressure', label: 'Barometric Pressure' },
      { name: 'water_conductivity', label: 'Water Conductivity' },
      { name: 'water_depth', label: 'Water Depth' },
      { name: 'water_temperature', label: 'Water Temp' },
      { name: 'heat_flux', label: 'Heat Flux' },
      { name: 'relative_humidity', label: 'Relative Humidity' },
      { name: 'signal.spreadingfactor', label: 'Spreadingfactor' },
      { name: 'solar_voltage', label: 'Solar Voltage' },
      { name: 'total_net_radiation', label: 'Total Net Radiation' },
      { name: 'vapour_pressure_deficit', label: 'Vapour Pressure Deficit' },

      {'name': 'frequency', 'label': 'Frequency'},
      {'name': 'header', 'label': 'Header'},
      {'name': 'signal.snr', 'label': 'Snr'},
      {'name': 'signal.rssi', 'label': 'Rssi'},
      {'name': 'uptime', 'label': 'Uptime'},
      {'name': 'voltage_adc', 'label': 'Voltage_adc'},
      {'name': 'net_longwave', 'label': 'Net_longwave'},
      {'name': 'net_shortwave', 'label': 'Net_shortwave'},
      {'name': 'packet_type', 'label': 'Packet_type'},
      {'name': 'payload_version', 'label': 'Payload_version'},
      {'name': 'battery_voltage', 'label': 'Battery_voltage'},
      {'name': 'charging_state', 'label': 'Charging_state'},
      {'name': 'command', 'label': 'Command'},
      {'name': 'digital_count', 'label': 'Digital_count'},
      {'name': 'fault', 'label': 'Fault'},
      {'name': 'vwc_d1', 'label': 'Vwc_d1'},
      {'name': 'vwc_d2', 'label': 'Vwc_d2'},
      {'name': 'vwc_d3', 'label': 'Vwc_d3'},
      {'name': 'vwc_d4', 'label': 'Vwc_d4'},
      {'name': 'temp_d1', 'label': 'Temp_d1'},
      {'name': 'temp_d2', 'label': 'Temp_d2'},
      {'name': 'temp_d3', 'label': 'Temp_d3'},
      {'name': 'temp_d4', 'label': 'Temp_d4'},

    ],

    /** todo: support per-node MFR_node configs(?), and organize:
      air temp,
      barometric press,
      battery,
      heat flux,
      net longwave,
      net shortwave,
      relative humidity,
      solar voltage,
      temp d1,
      tempd2,
      tempd3,
      tempd4,
      total net radiation,
      vapour pressure,
      voltage ac,
      vwc_d1 to d4,
      water conductivity,
      water depth,
      water temp,
    */
  },
  'RAK10701': { // rak tester
    'names':[
      {'name':'signal.pl','label':'PL'},
      {'name':'signal.plr','label':'PLR'},
      {'name':'signal.rssi','label':'RSSI'},
      {'name':'signal.snr','label':'SNR'},
      {'name':'signal.spreadingfactor','label':'Spreading Factor'}
    ]
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
  'degree': '°',           // pluginhut
  'milimeters': 'mm',
  'meters per second': 'm/s',
  'hits per square centimeter': 'hits / cm²',
  'hectoPascal': 'hPa',
  'mg/m^2': 'mg/m²',
  'mg/m^3': 'mg/m³',
  'unit': ' ',  // don't show 'unit'; artifact of LI-7500DS
}

/* other recent units
  'hPa'
  'UTC time'
  'seconds'
  'YYYY-MM-DD'
  '°C'
  'g/m^3'
  'kPa'
  'm/s'
  'HH:MM:SS'
  'ns'
  's'
  'volts'
*/

let skipSensorPreview = [
  'microphone',
  'gps',
  'bme280',
  'Lorawan Antenna',
  'lorawan',
  'Device_2',
  'MFR_node_MNLA4O102',
]

if (settings.project == 'CROCUS')
  skipSensorPreview = [...skipSensorPreview, 'bme680']

export { measurements, shortUnits, skipSensorPreview }
