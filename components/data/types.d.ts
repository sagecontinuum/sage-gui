
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

type CronUnit = typeof cronUnits[number]
type Op = keyof typeof ops
type BooleanLogic = typeof booleanLogics[number]

// a rule can be multiple things, but let's support basic conditions first
export type Rule = Condition

type Condition = {
  name: string
  op: Op
  value: number | string
}

