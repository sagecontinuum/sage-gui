import config from '/config'
import { handleErrors } from '/components/fetch-utils'
import * as BK from '/components/apis/beekeeper'

const url = config.experimentalData

export type Description = {
  label: string
  vsns: BK.VSN[]
  files: {
    vsn: BK.VSN
    url: string
    file_size: number
  }[]
  text_was_extracted?: boolean
  unextracted_text?: string
}

export function getDescriptions(file) : Promise<Description[]> {
  return fetch(`${url}/${file}`)
    .then(handleErrors)
    .then(res => res.json())
}
