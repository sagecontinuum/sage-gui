import config from '../../config'
export const url = config.sageCommons



function handleErrors(res) {
  if (res.ok) {
    return res
  }

  return res.json().then(errorObj => {
    throw Error(errorObj.error)
  })
}


function get(endpoint: string) {
  return fetch(endpoint)
    .then(handleErrors)
    .then(res => res.json())
}




export type FilterState = {
  [name: string]: string[]
}

type SearchArgs = {
  facets: string[]
  filters: FilterState
}

type Facet = {
  count: number
  display_name: string,
  name: string
}

export type Results = {
  [key: string]: any
}

type SearchRes = {
  help: string
  result: {
    count: number
    results: Results
    search_facets: {
      [facet: string] : { title: string, items: Facet[]}
    }
    sort: string  // ex: "score desc, metadata_modified desc"
  },
  success: boolean
}

export function search(args: SearchArgs) : Promise<SearchRes> {
  const {facets, filters} = args

  const req = `${url}/action/package_search`
    + `?facet.field=${JSON.stringify(facets)}`
    + `${fqBuilder(filters)}`

  return get(req)
}



/**
 * Return filter query in form:
 *    &fq=name:("filter one" AND "filter two") AND ...
 *
 * @param facets
 * @returns url param string fq portion of solr request
 */
function fqBuilder(facets: FilterState) : string{
  const parts = Object.entries(facets)
    .filter(([_, vals]) => vals.length )
    .map(([name, vals]) =>
      `${name}:(${vals.map(v => `"${v}"`).join(' AND ')})`
    )

  return parts.length ? `&fq=${parts.join(' AND ')}` : ``
}