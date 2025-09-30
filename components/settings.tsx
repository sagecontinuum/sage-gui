import { type ReactNode } from 'react'
import { type Node } from '/components/apis/beekeeper'
import CrocusLogo from './projects/logos/CROCUS-logo.svg'


// use env variable to load corresponding config below
const SAGE_UI_PROJECT = process.env.SAGE_UI_PROJECT || 'sage'

type Configs = {
  [key: string]: {
    project?: Node['project']
    focus?: string    // case insensitive for data/api purposes
    Logo?: ReactNode     // resolves to a full url of logo (see imports above)
    alt?: string      // logo alt text
    url?: string
    initialViewState?: { latitude: number, longitude: number, zoom: number }
    vsns?: Node['vsn'][]
    dataStart?: Date
    dataEnd?: Date
    dataProductPath?: string
  }
}

const configs : Configs = {
  'sage': {
    project: 'SAGE,SGT'
  },
  'apiary': {
    project: 'APIARY'
  },
  'dawn': {
    project: 'DAWN',
    initialViewState: { latitude: 41.88, longitude: -87.66, zoom: 12.3 }
  },
  'crocus': {
    Logo: () => <CrocusLogo />,
    alt: 'CROCUS',
    project: 'CROCUS',
    url: 'https://crocus-urban.org',
    initialViewState: { latitude: 41.88, longitude: -87.65, zoom: 8.7 }
  },
  'neon-mdp': {
    vsns: ['W038', 'W01D', 'W01F', 'V008'],
    dataStart: new Date('2022-04-05T12:00:00Z'),
    dataEnd: new Date('2022-05-05T12:00:00Z'),
    dataProductPath: '/data/product/neon-mdp-sage-wifire-bp3d-konza-prairie-burn-experiment'
  },
  'vto': {
    project: 'VTO',
    initialViewState: { latitude: 41.8, longitude: -87.9, zoom: 9.0 }
  }
}

export default {
  elapsedThresholds: {
    fail: 360000,
    warning: 180000
  },

  // merge in appropriate config from above
  ...configs[SAGE_UI_PROJECT.toLowerCase()],
}
