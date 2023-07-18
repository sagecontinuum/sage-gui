// use env variable to load corresponding config below
const SAGE_UI_PROJECT = process.env.SAGE_UI_PROJECT || 'sage'

const configs = {
  'sage': {
    project: 'SAGE'
  },
  'apiary': {
    logo: 'Apiary',
    project: 'Apiary'
  },
  'dawn': {
    logo: 'DAWN',
    project: 'DAWN'
  },
  'crocus': {
    logo: 'CROCUS',
    project: 'CROCUS',
    /* override default map view bounding box */
    initialViewState: {
      latitude: 41.97,
      longitude: -87.65,
      zoom: 9.0
    }
  },
  'neon-mdp': {
    logo: 'NEON-MDP',
    project: 'SAGE',
    focus: 'NEON-MDP'
  },
  'vto': {
    logo: 'VTO',
    project: 'VTO'
  }
}

export default {
  elapsedThresholds: {
    fail: 360000,
    warning: 180000
  },

  // merge in appropriate config from above
  ...configs[SAGE_UI_PROJECT.toLowerCase()],

  // currently used for custom sensors such as Met One;
  // todo(nc): this could be removed once the manifest DB v2.0 is used.
  mdpNodes: ['W038', 'W01D', 'W01F', 'V008']
}
