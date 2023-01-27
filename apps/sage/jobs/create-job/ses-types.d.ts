
// todo(nc): remove this nonsense
export type CLIArgStyle = '-' | '--'
export type ArgStyles = {[app: string]: CLIArgStyle}


/**
 * types for science rules
 */

// units for cronjobs
export const cronUnits = ['min', 'hour', 'dayOfMonth', 'month', 'dayOfWeek', '*'] as const
export const booleanLogics = ['and', 'or'] as const

// note the following ops are matched in this order as well
export const ops = {
  '<=': '≤',
  '>=': '≥',
  '!=': '≠',
  '=': '=',
  '<': '<',
  '>': '>'
} as const

export const actions = ['schedule', 'publish', 'set']


type CronUnit = typeof cronUnits[number]
type Op = keyof typeof ops
type BooleanLogic = typeof booleanLogics[number]
export type RuleAction = typeof actions[number]

// a rule can either be a cronjob or a conditional rule
export type Rule = CronRule | ConditionRule
export type RuleType = 'cron' | 'condition'


export type CronRule = {
  cron: string   // example: '* * * * *'
}

export const aggFuncs = ['avg', 'rate', 'sum', 'count', 'any'] as const
type AggFunc = typeof aggFuncs[number]

export type ConditionRule = {
  func: AggFunc
  name: string
  op: Op
  value: number
}

