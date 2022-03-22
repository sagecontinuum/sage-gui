
export default {
  filterNodes: true,      // if true, filter to "node monitoring" list
  hostSuffixMapping: {    // mapping for host suffix to short names (displayed in UI)
    'ws-rpi': 'rpi',
    'ws-nxcore': 'nx',
    'ws-nxagent': 'nxagent'
  },
  elapsedThresholds: {
    fail: 360000,
    warning: 180000
  },
  disableMap: false
}
