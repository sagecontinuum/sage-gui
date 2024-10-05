import { Rule } from './types.d'
import { get } from 'lodash'


export function queryData<Type>(data: Type[], query: string) : Type[] {
  return data.filter(row =>
    Object.values(row)
      .join('').toLowerCase()
      .includes(query.toLowerCase())
  )
}


const operation = {
  '<=': (a, b) => a <= b,
  '>=': (a, b) => a >= b,
  '!=': (a, b) => a != b,
  '=': (a, b) => a == b,
  '>': (a, b) => a > b,
  '<': (a, b) => a < b,
}

export function filterData(data, rules: Rule[]) {
  let d = data
  for (const rule of rules) {
    const {name, value} = rule

    if ('op' in rule)
      d = data.filter(row => operation[rule['op']](get(row, name), value))
    else {
      // assume range (value = [start, end])
      d = data.filter(row => operation['>='](get(row, name), value[0]))
        .filter(row => operation['<='](get(row, name), value[1]))
    }

  }

  return d
}