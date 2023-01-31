import {
  createCronString,
  createConditionString,
  createRuleString,
  createRules,
  parseCondition,
  parseConditions,
  parseCronString,
  parseRuleString
} from './createJobUtils'


/**
 * rule creation
 */


test('can create a cron string from object', async () => {
  expect(createCronString({action: 'schedule', cron: `*/1 2 * * *`})).toBe(`*/1 2 * * *`)

  // every min default
  expect(createCronString()).toBe(`* * * * *`)
  expect(createCronString(null)).toBe(`* * * * *`)
})


test('can create a condition string', async () => {
  const condRule = {
    func: 'avg' as const,
    name: 'env.temperature',
    op: '>=' as const,
    value: 4
  }

  const ruleStr = createConditionString(condRule)
  expect(ruleStr).toBe(`avg(v('env.temperature')) >= 4`)
})


// test that createRuleString figured out which type of string to create
test('can create rule string', async () => {
  const condRule = {
    func: 'avg' as const,
    name: 'env.temperature',
    op: '>=' as const,
    value: 4
  }

  let ruleStr = createRuleString('someAppName', condRule)
  expect(ruleStr).toBe(`avg(v('env.temperature')) >= 4`)


  const cronRule = {
    cron: '* */2 * * *'
  }

  ruleStr = createRuleString('someAppName', cronRule)
  expect(ruleStr).toBe(`cronjob('someAppName', '* */2 * * *')`)
})


test('can create complete rules', async () => {
  const rules = [{
    func: 'any' as const,
    name: 'env.car.count',
    op: '>=' as const,
    value: 1
  }, {
    func: 'avg' as const,
    name: 'env.temperature',
    op: '<' as const,
    value: 0
  }]

  const ruleStr = createRules('image-sampler', 'schedule', rules, ['and'])
  expect(ruleStr).toBe(`schedule('image-sampler'): any(v('env.car.count') >= 1) and avg(v('env.temperature')) < 0`)
})


/**
 * rule parsing
 */

test('can parse cron string', async () => {

  let obj = parseCronString('1,2,3 23 * * *')
  expect(obj.action).toBe('schedule')
  expect(obj.cron).toBe('1,2,3 23 * * *')

  obj = parseCronString('*/5 * * * *')
  expect(obj.cron).toBe('*/5 * * * *')

  expect(() => parseCronString('f o o * *')).toThrow('Could not parse cron string')
  expect(() => parseCronString('* * * * * *')).toThrow('Could not parse cron string')
})



test('can parse a condition', async () => {
  let str = `any(v('env.car.count') >= 1)`
  expect(parseCondition(str)).toMatchObject({
    func: 'any',
    name: 'env.car.count',
    op: '>=',
    value: 1
  })

  str = `sum(v('env.foo')) = 43`
  expect(parseCondition(str)).toMatchObject({
    func: 'sum',
    name: 'env.foo',
    op: '=',
    value: 43
  })

  str = `sum(v('env.foo')) != 43`
  expect(parseCondition(str)).toMatchObject({
    func: 'sum',
    name: 'env.foo',
    op: '!=',
    value: 43
  })

  str = `foo(v('iio.temperature')) > 0`
  expect(() => parseCondition(str)).toThrow('Invalid aggregate function')

  str = `any(v('env.car.count') foo 1)`
  expect(() => parseCondition(str)).toThrow('Invalid comparison operator')

  str = `any(v('env.car.count')) foo 1`
  expect(() => parseCondition(str)).toThrow('Invalid comparison operator')

  str = `any(v('env.car.count') == 1)`
  expect(() => parseCondition(str)).toThrow('Invalid conditional expression')
})



test('can parse multiple conditions with logic', async () => {
  const str = `any(v('env.car.count')) >= 1 and sum(v('env.foo')) = 43`

  const {conditions, logics} = parseConditions(str)
  expect(conditions).toMatchObject([{
    func: 'any',
    name: 'env.car.count',
    op: '>=',
    value: 1
  }, {
    func: 'sum',
    name: 'env.foo',
    op: '=',
    value: 43
  }])
  expect(logics).toMatchObject(['and'])
})



test('can parse complete rule strings', async () => {
  // test cron jobs
  let str = `schedule('image-sampler'): cronjob('image-sampler', '*/1 * * * *')`

  let obj
  try {
    obj = parseRuleString(str)
  } catch (e) {
    console.error(e)
  }

  let {app, rules, logics} = obj

  expect(app).toBe('image-sampler')

  expect(rules).toMatchObject([{
    action: 'schedule',
    cron: `'*/1 * * * *'`
  }])

  expect(logics).toMatchObject([])

  // testing conditionals
  str = `schedule('image-sampler'): any(v('env.car.count') >= 1) or avg(v('env.temperature')) < 0`

  try {
    obj = parseRuleString(str)
  } catch (e) {
    console.error(e)
  }

  app = obj.app,
  rules = obj.rules,
  logics = obj.logics

  expect(app).toBe('image-sampler')

  expect(rules).toMatchObject([{
    func: 'any',
    name: 'env.car.count',
    op: '>=',
    value: 1
  }, {
    func: 'avg',
    name: 'env.temperature',
    op: '<',
    value: 0
  }])

  expect(logics).toMatchObject(['or'])
})

