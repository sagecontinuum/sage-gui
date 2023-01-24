
// todo(nc): remove this nonsense
export type CLIArgStyle = '-' | '--'
export type ArgStyles = {[app: string]: CLIArgStyle}


/**
 * types for science rules
 */

// units for cronjobs
export const cronUnits = ['min', 'hour', 'day', 'month'] as const
export const ops = {'<': '<', '>': '>', '=': '=', '<=': '≤', '>=': '≥'} as const
export const booleanLogics = ['and', 'or'] as const


type CronUnit = typeof cronUnits[number]
type Op = keyof typeof ops
type BooleanLogic = typeof booleanLogics[number]

// a rule can either be a cronjob or a conditional rule
export type Rule = CronRule | ConditionRule
export type RuleAction = 'schedule' | 'publish' | 'set'
export type RuleType = 'cron' | 'condition'


export type CronRule = {
  amount: number
  unit: CronUnit
}

export const aggFuncs = ['avg', 'rate', 'sum', 'count'] as const
type AggFunc = typeof aggFuncs[number]

export type ConditionRule = {
  func: AggFunc
  name: string
  op: Op
  value: number
}

