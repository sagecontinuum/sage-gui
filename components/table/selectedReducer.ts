import React from 'react'

export type SelectedState = {
  lastSelected: number
  ids: string[] | number[]
  objs: object[]
}


export type Action = {
  type: 'SELECT_ALL' | 'CLEAR' | 'SET' | 'SHIFT_SET' | 'CTRL_SET'
  event?: React.MouseEvent | null
  id?: number
  rows?: object[]
  obj?: object
}


const initialSelectedState = {
  lastSelected: null,
  event: null,
  ids: [],
  objs: [],
}

export function getInitSelectedState(
  ids: string[] = [],
  data: object[],
  primaryKey: string
) : SelectedState {

  const objs = data.filter(o => ids.includes(o[primaryKey]))

  return {
    lastSelected: null,
    ids,
    objs
  }
}


// handles selection of rows
export default function selectedReducer(state: SelectedState, action: Action) {

  const {type, event} = action

  if (type == 'SELECT_ALL') {
    return {
      ...state,
      event,
      ids: action.rows.map(obj => obj.rowID),
      objs: action.rows
    }

  } else if (type == 'CLEAR') {
    return initialSelectedState

  } else if (type == 'SET' || state.lastSelected == null) {
    return {
      ...state,
      event,
      lastSelected: action.id,
      ids: [action.id],
      objs: [action.obj]
    }

  } else if (type == 'SHIFT_SET' && state.lastSelected != null) {
    const {lastSelected} = state

    let newObjs
    if (action.id <= lastSelected)
      newObjs = action.rows.filter(({rowID}) => rowID >= action.id && rowID <= lastSelected )
    else if (action.id > lastSelected)
      newObjs = action.rows.filter(({rowID}) => rowID >= lastSelected && rowID <= action.id)

    return {
      ...state,
      event,
      lastSelected: action.id,
      ids: newObjs.map(o => o.rowID),
      objs: newObjs
    }

  } else if (type == 'CTRL_SET') {
    // don't allow things to be re-added; clear instead
    if (state.ids.includes(action.id))
      return initialSelectedState

    return {
      ...state,
      event,
      lastSelected: action.id,
      ids: [...state.ids, action.id],
      objs: [...state.objs, action.obj]
    }

  } else {
    throw `selected object reducer: theres no action for '${action.type}`
  }
}
