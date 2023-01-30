
import { pick } from 'lodash'
import {
  actions,
  booleanLogics,
  ops,
  aggFuncs,
  type ArgStyles,
  type CLIArgStyle,
  type Action,
  type CronRule,
  type ConditionRule,
  type BooleanLogic,
  type Rule,
  type Op,
  type AggFunc,
  type CronUnit  // deprecate?
} from './ses-types.d'

import * as SES from '/components/apis/ses'
import config from '/config'

const docker = config.dockerRegistry


export function queryData(data: object[], query: string, cols: string[]) : object[] {
  return data.filter(row =>
    Object.values(pick(row, cols))
      .join('').toLowerCase()
      .includes(query.toLowerCase())
  )
}


/**
 * given an object, creates a cron string
 * @param rule {cron: '* * * * *'}
 * @returns crontab string expression or default
 *
 * todo(nc): enrich; this is bare minimum cron functionality
 */
export const createCronString = (rule?: CronRule) : string => {
  return rule?.cron || '* * * * *'
}


/**
 * given an object, creates a cron string
 * @param args {amount, unit}
 * @returns basic crontab string expression
 *
 */
export const createCronStringDeprecated = (args: {amount: string, unit: CronUnit}) : string => {
  const {amount, unit} = args
  return `'${[
    unit == 'min' ? `*/${amount}` : '*',
    unit == 'hour' ? `*/${amount}` : '*',
    unit == 'dayOfMonth' ? `*/${amount}` : '*',
    unit == 'month' ? `*/${amount}` : '*',
    unit == 'dayOfWeek' ? `*/${amount}` : '*',
  ].join(' ')}'`
}


/**
 * given a cron string, return object
 * @param str simple cron string using step value
 * @returns {amount, unit}
 *
 * todo(nc): use an advanced parser
 */
export const parseCronString = (str) : {amount: number, unit: CronUnit} => {
  const vals = str.split(' ').map(unit => unit.split('/')[1])

  let amount, unit
  ['min', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'].forEach((u, i)=> {
    const entry = vals[i]
    if (entry) {
      unit = u
      amount = parseInt(entry)
    }
  })

  return {amount, unit}
}

/**
 * given a conditional object, create a string such as:
 * avg(v('foo.temp')) >= 1
 * any(v('foo.temp') >= 1)
 * @param args {func, name, op, value}
 * @returns `${func}(v('${name}')) ${op} ${value}`
 */
export const createConditionString = (args: ConditionRule) : string => {
  const {func, name, op, value} = args

  if (func == 'any')
    return `${func}(v('${name}') ${op} ${value})`
  else
    return `${func}(v('${name}')) ${op} ${value}`
}


/**
 * given a condition string, create a conditional object
 * @param str condition string such as: avg(v('foo.temp')) >= 1
 * @returns {func, name, op, value}
 */
export const parseCondition = (str: string) : ConditionRule => {
  const opList = Object.keys(ops)

  const re = new RegExp(`(${opList.join('|')})`)
  const parts = str.split(re).map(s => s.trim())

  const [exp, op] = parts

  if (!opList.includes(op as Op)) {
    throw `Invalid comparison operator: ${op}\n` +
      `Must be one of: ${opList.join(', ')}`
  }

  // need to remove closing paren if entire if argument to callee is expresssion
  const value = parts[2].replace(/\)/g, '')

  if (parts.length != 3)
    throw `Invalid conditional expression: ${str}\n` +
      `Conditions must be of the form: <expression> <comparison_operator> <number|string>`

  const funcEnd = exp.indexOf('(')
  const nameStart = exp.indexOf(`v('`) + 3

  const func = exp.slice(0, funcEnd)
  const name = exp.slice(nameStart, exp.indexOf(`')`))

  if (!aggFuncs.includes(func as AggFunc)) {
    throw `Invalid aggregate function: ${func}\n` +
      `Must be one of: ${aggFuncs.join(', ')}`
  }

  return {
    func,
    name,
    op,
    value: Number.isNaN(value) ? value : Number(value)
  }
}


/**
 * given conditional expression string, return the conditions and logics
 * @param str conditional expresion such as: avg(v('foo.temp')) >= 1 and rate(v('foo.two')) < 3
 * @returns objs and list
 */
export const parseConditions = (str: string) : {conditions: ConditionRule[], logics: BooleanLogic[]} => {
  const strs = str.split(/(and|or)/g).map(s => s.trim() as BooleanLogic)
  const [ruleStrs, logics] = [
    strs.filter(s => !booleanLogics.includes(s)),
    strs.filter(s => booleanLogics.includes(s))
  ]

  const conditions = ruleStrs.map(str => parseCondition(str))

  return {conditions, logics}
}


/**
 * given a app name and rule, create rule syntax
 * @param appName name of app
 * @param rule object representing either cron or conditional rule
 * @returns rule string
 */
export const createRuleString = (appName: string, rule: Rule) : string =>
  'name' in rule ?
    createConditionString(rule) :
    `cronjob('${appName}', '${createCronString(rule)}')`




type ParsedRule = {app: string, rules: Rule[], logics: BooleanLogic[]}

/**
 * given any kind of "complete" science rules, return the parsed version
 * @param str given any kind of complete rule string
 * @returns PrasedRule
 */
export const parseRuleString = (str: string) : ParsedRule => {
  const action: Action = actions.find(action => str.startsWith(action))

  if (action == 'schedule') {
    const [actionKeyString, ruleStr] = str.split(': ')
    const app = actionKeyString.match(/\((.+)\)/)[1].replace(/'/g, '')


    if (ruleStr.includes('cronjob')) {
      const cronStr = ruleStr.replace(/cronjob\(|\)/g, '')
      const [appName, cron] = cronStr.split(',').map(s => s.trim())
      const rule = parseCronString(cron)

      return {
        app: appName.replace(/'|"/g, ''),   // remove quotes
        rules: [rule],
        logics: []
      }

    // assume v( is conditional rules; todo(nc): should be mixable with cronjobs, maybe use AST parser
    } else if (ruleStr.includes('v(')) {
      const {conditions, logics} = parseConditions(ruleStr)
      return {
        app,
        rules: conditions,
        logics
      }

    } else {
      throw `can not parse rule: ${str}`
    }
  } else {
    throw `can not parse rule: ${str}`
  }
}

/**
 * given appName and the set of rules, create all the strings
 * @param appName
 * @param action
 * @param rules
 * @param logics
 * @returns
 */
export const createRules = (
  appName: string,
  action: Action,
  rules: Rule[],
  logics: BooleanLogic[]
) : string | string[] => {

  if (action == 'schedule') {
    return `schedule('${appName}'): ` + rules.map((r, i) =>
      `${createRuleString(appName, r)}${i < logics?.length ? ` ${logics[i]} ` : ''}`
    ).join('')
  } else if (action == 'publish') {
    return rules.map((r) =>
      `publish(${r.publish}): ${createRuleString(appName, r)}`
    )
  } else if (action == 'set') {
    return rules.map((r) => {
      const value = Number.isNaN(Number(r.state)) ? `'${r.state}'` : Number(r.state)
      return `set(${r.stateKey}, value=${value}): ${createRuleString(appName, r)}`
    })
  }

}



/**
 * given strings of science rules, parse into objects
 * @param strs string
 * @returns ParsedRules[]
 */
export const parseRules = (strs: string[]) : ParsedRule[] => {
  return strs.map(str => parseRuleString(str))
}


type ParsedPlugins = {
  params: {[pluginID: string]: object} // app params as object (instead of list)
  argStyles: ArgStyles
}

export const parsePlugins = (plugins: SES.JobTemplate['plugins']) : ParsedPlugins => {
  const argStyles = {}
  const params = plugins.reduce((acc, obj) => {
    const {image, args} = obj.pluginSpec

    const mapObj = argListToMap(args)
    const map = mapObj.mapping

    const id = image.replace(`${docker}/`, '')

    argStyles[id] = mapObj.argStyle

    return {
      ...acc,
      [id]: map
    }
  }, {})

  return {params, argStyles}
}

type MappingObj = {
  mapping: {[key: string]: string | null}
  argStyle: CLIArgStyle
}

export const argListToMap = (args: string[] = []) : MappingObj => {
  // infer param style convention
  let argStyle
  if (args.some(arg => arg.startsWith('--'))) {
    argStyle = '--'
  } else if (args.some(arg => arg.startsWith('-'))) {
    argStyle = '-'
  } else {
    throw `No CLI arg convention found.\n` +
      `App param CLI style is currently inferred from inputs provided to the scheduler, ` +
      `and perhaps no inputs were given to infer on.`
  }

  const mapping = args.reduce((acc, str, i) => {
    const nextIdx = i + 1

    // inspect next str, and set as false if none provided
    let next = null
    if (nextIdx < args.length) {
      next = args[nextIdx].startsWith(argStyle) ? false : args[nextIdx]
    }

    // if is a param key, we'll add it to the mapping
    if (str.startsWith(argStyle)) {
      // if no param value, we assume the param is a boolean true, so the value of null
      return {...acc, [str.slice(argStyle.length)]: next ? next : null}
    }

    return acc
  }, {})

  return {mapping, argStyle}
}


export const appIDToName = (id: string) =>
  id.slice(id.indexOf('/') + 1, id.lastIndexOf(':'))

