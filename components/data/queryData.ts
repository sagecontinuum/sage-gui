import { Rule, BooleanLogic } from './types.d'
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

export function filterData(data, rules: Rule[], logics: BooleanLogic[]) {
  let d
  for (const rule of rules) {
    const {name, op, value} = rule
    console.log('rule', rule)
    d = data.filter(row => operation[op](get(row, name), value))
  }

  return d
}