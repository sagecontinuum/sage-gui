import * as BK from '/components/apis/beekeeper'
import * as BH from '/components/apis/beehive'
import { groupBy, intersection, sum, pick } from 'lodash'

import { NO_ASSIGNMENT } from './Data'


type Filters = {
  [name: string]: string[]
}

export const initFilterState = {
  'project': [],
  'focus': [],
  'location': [],
  'vsn': []
}

export const initDataState = {
  rawData: null,
  data: null,
  filtered: [],
  filters: initFilterState
}

export function dataReducer(state, action) {
  // todo(nc): note: we likely won't need both ADD_FILTER and RM_FILTER?
  switch (action.type) {
  case 'INIT_DATA': {
    const {filters} = state
    const {manifests} = action
    const {rawData, data} = action.data

    let filtered = sortVSNs(Object.keys(data))
    filtered = getFilteredVSNs(manifests, data, filters)

    return {
      ...state,
      rawData,
      data,
      filtered,
      byApp: groupByApp(rawData, filtered)
    }
  }
  case 'SET_DATA': {
    return {
      ...state,
      data: action.data
    }
  }
  case 'ADD_FILTER': {
    const {data, filters} = state
    const {manifests, facet, val} = action

    // new filter state
    const newFilters = {
      ...filters,
      [facet]: [...filters[facet], val]
    }

    // new filtered data, using "manifest" data
    const filtered = getFilteredVSNs(manifests, data, newFilters)

    return {
      ...state,
      filtered,
      filters: newFilters,
      byApp: groupByApp(state.rawData, filtered)
    }
  }
  case 'RM_FILTER': {
    const {data, filters} = state
    const {manifests, facet, val} = action

    // new filter state
    const newFilters = {
      ...filters,
      [facet]: filters[facet].filter(v => v != val)
    }

    // new filtered data, using "manifest" data
    const filtered = getFilteredVSNs(manifests, data, newFilters)

    return {
      ...state,
      filtered,
      filters: newFilters,
      byApp: groupByApp(state.rawData, filtered)
    }
  }
  case 'SELECT_ALL': {
    const {data, filters} = state
    const {manifests, facet, vals} = action

    const newFilters = {...filters, [facet]: vals}
    const filtered = getFilteredVSNs(manifests, data, newFilters)

    return {
      ...state,
      filtered,
      filters: newFilters,
      byApp: groupByApp(state.rawData, filtered)
    }
  }
  case 'CLEAR_CATEGORY': {
    const {data, filters} = state
    const {manifests, facet} = action

    const newFilters = {...filters, [facet]: []}
    const filtered = getFilteredVSNs(manifests, data, newFilters)

    return {
      ...state,
      filtered,
      filters: newFilters,
      byApp: groupByApp(state.rawData, filtered)
    }
  }
  case 'ERROR': {
    return ({
      ...state,
      error: action.error
    })
  }
  default: {
    return state
  }
  }
}



// core logic for intersection of unions; could be optimized or simplified if needed
const getFilteredVSNs = (manifests: BK.Manifest[], data, filters: Filters) => {
  const vsnsByField = {}
  for (const [field, vals] of Object.entries(filters)) {
    for (const manifest of manifests) {

      let isEmpty
      if (vals.includes(NO_ASSIGNMENT) && manifest[field] == '')
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        isEmpty = true
      else if (!vals.includes(manifest[field]))
        continue

      const vsn = manifest.vsn
      vsnsByField[field] = field in vsnsByField ?
        [...vsnsByField[field], vsn] : [vsn]
    }
  }

  const count = sum(Object.values(vsnsByField).map(vals => vals.length))

  const vsns = count ?
    intersection(...Object.values(vsnsByField)) : manifests.map(m => m.vsn)

  // find intersection of vsns and data vsns
  let vsnSubset = Object.keys(data)
    .filter(vsn => vsns.includes(vsn))

  vsnSubset = sortVSNs(vsnSubset)
  return vsnSubset
}



// sort by node, then blade
const sortVSNs = (vsns: string[]) => ([
  ...vsns.filter(vsn => vsn.charAt(0) == 'W').sort(),
  ...vsns.filter(vsn => vsn.charAt(0) == 'V').sort()
])





export function groupByApp(data: BH.Record[], vsns: string[] ) {
  const byApp = groupBy(data, 'meta.plugin')
  const byAppByNode = Object.keys(byApp)
    .reduce((acc, app) => {
      let grouped = groupBy(byApp[app], 'meta.vsn')
      grouped = pick(grouped, vsns)
      const hasData = !!Object.keys(grouped).length
      return hasData ? {...acc, [app]: grouped} : acc
    }, {})

  return byAppByNode
}
