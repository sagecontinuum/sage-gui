import { useEffect, useReducer, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import styled from 'styled-components'

import { TextField, Button, Alert } from '@mui/material'
import { Step, StepTitle } from '/components/layout/FormLayout'

import Clipboard from '/components/utils/Clipboard'
import { Card, CardViewStyle } from '/components/layout/Layout'
import AppSelector from './AppSelector'
import SelectedAppTable from './SelectedAppTable'
import NodeSelector from './NodeSelector'
import RuleBuilder, { Rule, BooleanLogic, CronRule } from './RuleBuilder'
import SuccessBuilder from './SuccessBuilder'

import { useSnackbar } from 'notistack'
import * as YAML from 'yaml'

import type { App } from '/components/apis/ecr'
import type { VSN, Manifest } from '/components/apis/beekeeper'

import * as SES from '/components/apis/ses'
import Auth from '/components/auth/auth'
const user = Auth.user

import config from '/config'
import ErrorMsg from '../../ErrorMsg'

const docker = config.dockerRegistry


// todo(nc): remove this nonsense
export type CLIArgStyle = '-' | '--'
export type ArgStyles = {[app: string]: CLIArgStyle}


const createCronString = ({amount, unit}) => `'${[
  unit == 'min' ? `*/${amount}` : '*',
  unit == 'hour' ? `*/${amount}` : '*',
  unit == 'day' ? `*/${amount}` : '*',
  unit == 'month' ? `*/${amount}` : '*',
  '*'
].join(' ')}'`



type ParsedRule = {app: string, rules: Rule[], logics: BooleanLogic[]}

const createRuleString = (appName: string, rule: Rule) : string =>
  'name' in rule ?
    `v('${rule.name}') ${rule.op} ${rule.value}` :
    `schedule(${appName}): cronjob('${appName}', ${createCronString(rule)})`



const parseRuleString = (str: string) : ParsedRule => {
  if (str.startsWith('schedule')) {
    let cronStr = str.split(': ')[1]
    cronStr = cronStr.replace(/cronjob\(|\)/g, '')
    const [appName, cronConfig] = cronStr.split(', ')
    const [min, hour, day, month, dayOfWeek] = cronConfig.split(' ').map(unit => unit.split('/')[1])

    // todo(nc): WIP, finish

    return {
      app: appName,
      rules: [],
      logics: []
    }
  } else {
    throw `can not parse rule: ${str}`
  }
}


// todo: here we assume we only have conditions and cronjobs;
// generalize and add rule types
const createRuleStrings = (appName: string, rules: Rule[], logics: BooleanLogic[]) : string =>
  rules.map((r, i) =>
    `${createRuleString(appName, r)}${i < logics?.length ? ` ${logics[i]} ` : ''}`
  ).join('')


const parseRuleStrings = (strs: string[]) => {
  return strs.map(str => parseRuleString(str))
}


type ParsedPlugins = {
  params: {[pluginID: string]: object} // app params as object (instead of list)
  argStyles: ArgStyles
}

const parsePlugins = (plugins: SES.JobTemplate['plugins']) : ParsedPlugins => {
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


type State = {
  name: ''
  apps: App[]
  nodes: VSN[]
  rules: {
    [app: string]: {
      rules: Rule[]
      logics: BooleanLogic[]
    }
  }
}

type Action = {type: 'SET', name: string, value: string | App[] | Manifest[] }


function reducer(state, action) {
  const {type, name, value} = action

  switch (type) {
  case 'SET':
    return {
      ...state,
      [name]: value
    }
  case 'SET_RULES':
    const {app, rules, logics} = value
    return {
      ...state,
      rules: {...state.rules, [app]: {rules, logics}}
    }
  default:
    throw new Error(`formReducer: type "${type}" not valid`)
  }
}

const initState = {
  name: '',
  apps: [],
  nodes: [],
  rules: []
}


export default function CreateJob() {
  const { enqueueSnackbar } = useSnackbar()

  const params = new URLSearchParams(useLocation().search)
  const jobID = params.get('start_with_job')

  const [{name, apps, nodes, rules}, dispatch] = useReducer(reducer, initState)

  const [appParams, setAppParams] = useState<ParsedPlugins['params']>({})


  // note: we can't infer CLI convention unless there were some params provided :()
  const [argStyles, setArgStyles] = useState<ArgStyles>({})
  const [successCriteria, setSuccessCriteria] = useState({amount: 1, unit: 'day'})

  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState(null)

  // if needed, initialize form with job spec
  useEffect(() => {
    if (!jobID) return

    SES.getTemplate(jobID)
      .then((spec) => {
        const {name, plugins, nodes, scienceRules} = spec

        // determine app params and cli arg styles
        const {params, argStyles} = parsePlugins(plugins)
        setAppParams(params)
        setArgStyles(argStyles)

        // init with
        const initSelected = Object.keys(params).map(id => ({id}))
        dispatch({type: 'SET', name: 'name', value: name})
        dispatch({type: 'SET', name: 'apps', value: initSelected})
        dispatch({type: 'SET', name: 'nodes', value: Object.keys(nodes)})
        dispatch({type: 'SET_RULES', name: 'rules', value: parseRuleStrings(scienceRules)})
      })
      .catch((error) => {
        alert(`Oh no.  This app couldn not be initialized with previous params:\n\n${error}`)
      })
  }, [jobID])

  const handleAppSelection = (value: App[]) => {
    dispatch({type: 'SET', name: 'apps', value})
  }

  const handleNodeSelection = (value: string[]) => {
    dispatch({type: 'SET', name: 'nodes', value})
  }

  const handleRuleSelection = (app, rules, logics) => {
    dispatch({type: 'SET_RULES', value: {app, rules, logics}})
  }

  const handleSuccessUpdate = (name, value) => {
    setSuccessCriteria(prev => ({...prev, [name]: value}))
  }

  const handleAppParamUpdate = (appID: string, name, value: string | boolean) => {
    if (typeof value == 'boolean') {
      setAppParams(prev => {
        let params = prev[appID]
        if (value == false) {
          delete params[name]
        } else {
          params = {...params, [name]: null}
        }
        return {...prev, [appID]: {...params}}
      })
    } else {
      setAppParams(prev => ({...prev, [appID]: {...prev[appID], [name]: value}}))
    }
  }

  const getYaml = () => {
    return YAML.stringify({
      name,
      ...(user && {user}),
      plugins:
        apps.map(o => {
          const argStyle = o.id in argStyles ? argStyles[o.id] : '-'

          return {
            name: appParams[o.id]?.appName || appIDToName(o.id),
            pluginSpec: {
              image: `${docker}/${o.id}`,
              args: appParams[o.id] ?
                Object.entries(appParams[o.id])
                  .filter(([k, _]) => k != 'appName')
                  .map(([k, v]) => v == null ? `${argStyle}${k}` : [`${argStyle}${k}`, v]).flat()
                : []
            }
          }
        }),
      nodes: nodes.reduce((acc, vsn) => ({...acc, [vsn]: true}), {}) ,
      scienceRules:
        Object.keys(rules).map(appID => {
          const obj = rules[appID],
            ruleList = obj.rules

          if (!ruleList.length)
            return null

          return createRuleStrings(appParams[appID]?.appName || appIDToName(appID), ruleList, obj.logics)
        }).filter(s => !!s),
      successCriteria: [`Walltime(${successCriteria.amount}${successCriteria.unit})`]
    })
  }


  const handleSubmit = () => {
    setError(null)

    setSubmitting(true)
    SES.submitJob(getYaml())
      .then(() => {
        enqueueSnackbar(
          <>
            Job created!
            <Button component={Link} to="/jobs/my-jobs" variant="contained" sx={{marginLeft: '50px'}}>
              view job
            </Button>
          </>
          , {variant: 'success'}
        )
      })
      .catch(err => setError(err))
      .finally(() => setSubmitting(false))
  }

  const disableSubmit = () =>
    !(user && name && apps.length && nodes.length)


  return (
    <Root>
      <CardViewStyle/>
      <main className="flex column gap">
        <h1><Link to="/jobs/my-jobs">My jobs</Link> / Create job (Science Goal)</h1>

        <Alert severity="info">
          <b>Note:</b> the create and recreate job form is currently an
          <b> experimental feature</b> and in the <b>early stages of development</b>.{' '}
          <a href="https://docs.waggle-edge.ai/docs/tutorials/schedule-jobs" target="_blank" rel="noreferrer">
            Read more...
          </a>
        </Alert>

        <Card>
          <Step icon="1" label="Your science goal name">
            <TextField
              label="Name"
              id="science-goal-name"
              placeholder="my science goal"
              value={name}
              onChange={evt => dispatch({type: 'SET', name: 'name', value: evt.target.value})}
              style={{width: 500}}
            />
          </Step>
        </Card>

        <Card>
          <Step icon="2a" label="Select apps to use">
            <AppSelector
              selected={apps}
              onSelected={handleAppSelection}
            />
          </Step>

          {/* todo(nc): fix apps and appParams data model! */}
          {apps?.length > 0 && <>
            <Step icon="2b" label="Selected apps / specify params">
              <SelectedAppTable
                selected={apps}
                appArgs={appParams}
                argStyles={argStyles}
                onChange={handleAppParamUpdate}
              />
            </Step>
          </>}
        </Card>

        <Card>
          <StepTitle icon="3" label="Select nodes"/>
          <Step>
            <NodeSelector selected={nodes} onSelected={handleNodeSelection} />
          </Step>
        </Card>

        <Card>
          <StepTitle icon="4" label="Create rules" />
          <Step>
            {apps.length == 0 &&
              <span className="muted">First select apps and node(s)</span>
            }
            {apps.length > 0 &&
              <RuleBuilder apps={apps}
                onChange={handleRuleSelection}
              />
            }
          </Step>
        </Card>

        <Card>
          <StepTitle icon="5" label="Success criteria" />
          <Step>
            <SuccessBuilder apps={apps} {...successCriteria} onChange={handleSuccessUpdate}/>
          </Step>
          <br/>
          <Step>
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={disableSubmit() || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Job'}
            </Button>
          </Step>
        </Card>

        {error && !submitting &&
          <ErrorMsg>{error.message}</ErrorMsg>
        }

        <div>
          <h2>Or, use the following spec with the Edge Scheduler (ES)</h2>
          <Clipboard content={getYaml()} />
        </div>
      </main>
    </Root>
  )
}


const Root = styled.div`
  margin: 0 auto;
  max-width: 1200px;
  padding-bottom: 200px;

  main {
    margin: 0 20px;
  }

  // override for card styling
  .step-content {
    margin-bottom: 0;
  }
`
