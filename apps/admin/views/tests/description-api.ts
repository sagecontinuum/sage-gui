import config from '/config'
import { handleErrors } from '/components/fetch-utils'
import * as BK from '/components/apis/beekeeper'

const url = config.experimentalData

type Description = {
  label: string
  vsns: BK.VSN
}

export function getDescriptions() : Promise<Description[]> {
  return fetch(`${url}/descriptions.json`)
    .then(handleErrors)
    .then(res => res.json())
}
