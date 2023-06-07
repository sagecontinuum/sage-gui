
// use env variable to load corresponding config below
const SAGE_UI_PROJECT = process.env.SAGE_UI_PROJECT || 'sage'

const configs = {
  'sage': {
    project: 'SAGE'
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
  ...configs[SAGE_UI_PROJECT.toLowerCase()]
}
