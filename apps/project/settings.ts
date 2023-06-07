
// use env variable to load corresponding config below
const SAGE_UI_PROJECT = process.env.SAGE_UI_PROJECT || 'sage'

const configs = {
  'sage': {
    logo: 'SAGE',
    project: 'SAGE'
  },
  'dawn': {
    logo: 'DAWN',
    project: 'DAWN'
  },
  'crocus': {
    logo: 'CROCUS',
    project: 'CROCUS'
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
  SAGE_UI_PROJECT,
  elapsedThresholds: {
    fail: 360000,
    warning: 180000
  },
  ...configs[SAGE_UI_PROJECT.toLowerCase()]
}
