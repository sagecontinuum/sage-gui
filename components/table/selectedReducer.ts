

export type SelectedState = {
  lastSelected: number
  ids: number[]
  objs: any[]
}


export type Action = {
  type: 'SELECT_ALL' | 'CLEAR' | 'SET' | 'SHIFT_SET' | 'CTRL_SET'
  id?: number
  rows?: any[]
  obj?: any
}


export const initialSelectedState = {
  lastSelected: null,
  ids: [],
  objs: []
}


// handles selection of rows
const selectedReducer = (state: SelectedState, action: Action) => {

  const {type} = action

  if (type == 'SELECT_ALL') {
    return {
      ...state,
      ids: action.rows.map(obj => obj.rowID),
      objs: action.rows
    }

  } else if (type == 'CLEAR') {
    return initialSelectedState

  } else if (type == 'SET' || state.lastSelected == null) {
    return {
      ...state,
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
      lastSelected: action.id,
      ids: [...state.ids, action.id],
      objs: [...state.objs, action.obj]
    }

  } else {
    throw `selected object reducer: theres no action for '${action.type}`
  }
}

export default selectedReducer