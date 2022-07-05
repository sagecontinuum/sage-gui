import { useReducer, useState } from 'react'
import styled from 'styled-components'

import TextField from '@mui/material/TextField'
import { Step, StepTitle } from '../../common/FormLayout'

import Clipboard from '/components/utils/Clipboard'
import AppSelector from './AppSelector'
import SelectedAppTable from './SelectedAppTable'
import NodeSelector from './NodeSelector'
import RuleBuilder, { Rule, BooleanLogic } from './RuleBuilder'
import SuccessBuilder from './SuccessBuilder'

import * as YAML from 'yaml'

import { type App } from '/components/apis/ecr'
import { type Manifest } from '/components/apis/beekeeper'



const getCronString = ({amount, unit}) => `'${[
  unit == 'min' ? `*/${amount}` : '*',
  unit == 'hour' ? `*/${amount}` : '*',
  unit == 'day' ? `*/${amount}` : '*',
  unit == 'month' ? `*/${amount}` : '*'
].join(' ')}'`


const getRuleString = (appName, rule: Rule) =>
  'name' in rule ?
    `v('${rule.name}') ${rule.op} ${rule.value}` :
    `cronjob(${appName}, ${getCronString(rule)})`


// todo: here we assume we only have conditions and cronjobs;
// generalize and add rule types
const createRuleStrings = (appName: string, rules: Rule[], logics: BooleanLogic[]) =>
  rules.map((r, i) =>
    `${getRuleString(appName, r)}${i < logics?.length ? ` ${logics[i]} ` : ''}`
  ).join('')



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
  const [{name, apps, nodes, rules}, dispatch] = useReducer(reducer, initState)

  const [appParams, setAppParams] = useState({})
  const [successCriteria, setSuccessCriteria] = useState({amount: 1, unit: 'day'})


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
      plugins: apps.map(o => ({
        pluginSpec: {
          image: o.id,
          args: appParams[o.id] ?
            Object.entries(appParams[o.id]).map(([k, v]) => [`-${k}`, v]).flat() : []
        }
      })),
      nodes: nodes.map(o => o.vsn),
      rules: Object.keys(rules).map(appName => {
        const obj = rules[appName],
          ruleList = obj.rules

        if (!ruleList.length)
          return null

        return `${appName}: ${createRuleStrings(appName, ruleList, obj.logics)}`
      }).filter(s => !!s),
      successCriteria: `Walltime(${successCriteria.amount}${successCriteria.unit})`
    })
  }

  return (
    <Root>
      <main>
        <h1>Create Job (Science Goal)</h1>

        <Step icon="1" label="Your science goal name">
          <TextField
            label="Name"
            placeholder="my science goal"
            value={name}
            onChange={evt => dispatch({type: 'SET_NAME', value: evt.target.value})}
            style={{width: 500}}
          />
        </Step>


        <Step icon="2a" label="Select apps to use">
          <AppSelector onSelected={handleAppSelection}/>
        </Step>

        {apps?.length > 0 && <>
          <Step icon="2b" label="Selected apps / specify params">
            <SelectedAppTable selected={apps} onChange={handleAppParamUpdate} />
          </Step>
        </>}


        <StepTitle icon="3" label="Select nodes"/>
        <Step>
          <NodeSelector onSelected={handleNodeSelection} />
        </Step>


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


        <StepTitle icon="5" label="Success criteria" />
        <Step>
          <SuccessBuilder apps={apps} {...successCriteria} onChange={handleSuccessUpdate}/>
        </Step>


        {/*
        <Step>
          <Button
            onClick={onSubmit}
            variant="outlined"
            color="primary"
            // disabled={disableSubmit()}
            >
            Create Spec
          </Button>
        </Step>
        */}

        <div>
          <h2>Use following spec with the Sage Edge Scheduler (SES)</h2>
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
`
