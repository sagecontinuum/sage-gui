
// use env variable to load corresponding config below
const SAGE_UI_PROJECT = process.env.SAGE_UI_PROJECT

const configs = {
  'dawn': {
    logo: 'DAWN',
    project: 'DAWN'
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
