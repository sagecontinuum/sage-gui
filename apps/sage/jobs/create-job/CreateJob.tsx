import { useReducer, useState } from 'react'
import { Link } from 'react-router-dom'

import styled from 'styled-components'

import TextField from '@mui/material/TextField'
import { Step, StepTitle } from '/components/layout/FormLayout'

import Clipboard from '/components/utils/Clipboard'
import { Card, CardViewStyle } from '/components/layout/Layout'
import AppSelector from './AppSelector'
import SelectedAppTable from './SelectedAppTable'
import NodeSelector from './NodeSelector'
import RuleBuilder, { Rule, BooleanLogic } from './RuleBuilder'
import SuccessBuilder from './SuccessBuilder'

import { useSnackbar } from 'notistack'
import * as YAML from 'yaml'

import { type App } from '/components/apis/ecr'
import { type Manifest } from '/components/apis/beekeeper'

import * as SES from '/components/apis/ses'
import Auth from '/components/auth/auth'
const user = Auth.user

import config from '/config'
import Button from '@mui/material/Button'
import ErrorMsg from '../../ErrorMsg'
const docker = config.dockerRegistry


const getCronString = ({amount, unit}) => `'${[
  unit == 'min' ? `*/${amount}` : '*',
  unit == 'hour' ? `*/${amount}` : '*',
  unit == 'day' ? `*/${amount}` : '*',
  unit == 'month' ? `*/${amount}` : '*'
].join(' ')}'`


const getRuleString = (appName: string, rule: Rule) =>
  'name' in rule ?
    `v('${rule.name}') ${rule.op} ${rule.value}` :
    `schedule('${appName}'): cronjob('${appName}', ${getCronString(rule)})`


// todo: here we assume we only have conditions and cronjobs;
// generalize and add rule types
const createRuleStrings = (appName: string, rules: Rule[], logics: BooleanLogic[]) =>
  rules.map((r, i) =>
    `${getRuleString(appName, r)}${i < logics?.length ? ` ${logics[i]} ` : ''}`
  ).join('')


export const appIDToName = (id: string) =>
  id.slice(id.indexOf('/') + 1, id.lastIndexOf(':'))


type State = {
  name: ''
  apps: App[]
  nodes: Manifest[]
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

  const [{name, apps, nodes, rules}, dispatch] = useReducer(reducer, initState)

  const [appParams, setAppParams] = useState({})
  const [successCriteria, setSuccessCriteria] = useState({amount: 1, unit: 'day'})

  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState(null)

  const handleAppSelection = (value: App[]) => {
    dispatch({type: 'SET', name: 'apps', value})
  }

  const handleNodeSelection = (value: string[]) => {
    dispatch({type: 'SET', name: 'nodes', value})
  }

  const handleRuleSelection = (app, rules, logics) => {
    dispatch({type: 'SET_RULES', value: {app, rules, logics}})
  }

  const handleAppParamUpdate = (form) => {
    setAppParams(form)
  }

  const handleSuccessUpdate = (name, value) => {
    setSuccessCriteria(prev => ({...prev, [name]: value}))
  }


  const getYaml = () => {
    return YAML.stringify({
      name,
      ...(user && {user}),
      plugins: apps.map(o => ({
        name: appParams[o.id]?.pluginName || appIDToName(o.id),
        pluginSpec: {
          image: `${docker}/${o.id}`,
          args: appParams[o.id] ?
            Object.entries(appParams[o.id])
              .filter(([k, _]) => k != 'pluginName')
              .map(([k, v]) => [`-${k}`, v]).flat()
            : []
        }
      })),
      nodes: nodes.reduce((acc, obj) => ({...acc, [obj.vsn]: true}), {}) ,
      scienceRules: Object.keys(rules).map(appID => {
        const obj = rules[appID],
          ruleList = obj.rules

        if (!ruleList.length)
          return null

        return `${createRuleStrings(appParams[appID]?.pluginName || appIDToName(appID), ruleList, obj.logics)}`
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
        <h1>Create Job (Science Goal)</h1>

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
            <AppSelector onSelected={handleAppSelection}/>
          </Step>

          {apps?.length > 0 && <>
            <Step icon="2b" label="Selected apps / specify params">
              <SelectedAppTable selected={apps} onChange={handleAppParamUpdate} />
            </Step>
          </>}
        </Card>

        <Card>
          <StepTitle icon="3" label="Select nodes"/>
          <Step>
            <NodeSelector onSelected={handleNodeSelection} />
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
