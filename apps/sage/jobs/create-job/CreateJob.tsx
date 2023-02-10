import { useCallback, useEffect, useReducer, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

import styled from 'styled-components'

import { TextField, Button, Alert, Tooltip, Badge } from '@mui/material'
import FormEditorIcon from '@mui/icons-material/FormatListNumberedRounded'
import EditorIcon from '@mui/icons-material/DataObjectRounded'

import Clipboard from '/components/utils/Clipboard'
import { Step, StepTitle } from '/components/layout/FormLayout'
import { Card, CardViewStyle } from '/components/layout/Layout'
import { Tabs, Tab } from '/components/tabs/Tabs'
import CopyBtn from '/components/utils/CopyBtn'
import ConfirmationDialog from '/components/dialogs/ConfirmationDialog'

import AppSelector from './AppSelector'
import SelectedAppTable from './SelectedAppTable'
import NodeSelector, { parseManifest } from './NodeSelector'
import RuleBuilder from './RuleBuilder'
import SuccessBuilder from './SuccessBuilder'

import {
  type ParsedPlugins,
  appIDToName,
  createRules,
  parsePlugins,
  parseRules,
} from './createJobUtils'
import {
  type Rule,
  type BooleanLogic,
  type ArgStyles,
  aggFuncs
} from './ses-types.d'

import { useSnackbar } from 'notistack'
import * as YAML from 'yaml'

import type { App } from '/components/apis/ecr'
import type { VSN, Manifest } from '/components/apis/beekeeper'

import * as SES from '/components/apis/ses'
import Auth from '/components/auth/auth'
const user = Auth.user

import config from '/config'
import ErrorMsg from '../../ErrorMsg'
import HelpOutlineRounded from '@mui/icons-material/HelpOutlineRounded'

import * as ECR from '/components/apis/ecr'
import * as BK from '/components/apis/beekeeper'
import * as User from '/components/apis/user'
import TextEditor, { registerAutoComplete } from './TextEditor'

const docker = config.dockerRegistry

type View = 'form' |'editor'

// todo(nc): actually use State/Action types
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
  const tab = params.get('tab') as View

  const [{name, apps, nodes, rules}, dispatch] = useReducer(reducer, initState)

  const [appParams, setAppParams] = useState<ParsedPlugins['params']>({})
  const [view, setView] = useState<View>(tab || 'form')

  // note: we can't infer CLI convention unless there were some params provided :()
  const [argStyles, setArgStyles] = useState<ArgStyles>({})
  const [successCriteria, setSuccessCriteria] = useState({amount: 1, unit: 'day'})

  const [submitting, setSubmitting] = useState<boolean>(false)
  const [error, setError] = useState(null)
  const [initError, setInitError] = useState(null)

  const [editorState, setEditorState] = useState<{content: string, json: SES.JobTemplate}>({})
  const [editorMsg, setEditorMsg] = useState('')


  useEffect(() => {

    // how to register for custom language support (if actually needed)
    // monaco.languages.register({ id: 'SageYamlSpec' })
    // monaco.languages.setMonarchTokensProvider('SageYamlSpec', monacoYaml)

    /* todo(nc): json schema config
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      schemas: [{
        uri: '',
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' }
          }
        }
      }]
    })*/

    const keywords = [
      'name', 'plugins', 'nodes', 'scienceRules', 'successCriteria',
      ...aggFuncs, 'rate', 'v'
    ]

    const p1 = ECR.listApps('public')
    const p2 = BK.getNodeDetails()
    const p3 = User.listNodesWithPerm('schedule')

    Promise.allSettled([p1, p2, p3])
      .then(([apps, objs, schedulable]) => {
        objs = parseManifest(objs.value)
        if (schedulable.status == 'fullfilled') {
          objs = objs.filter(o => schedulable.value.includes(o.vsn))
        }

        registerAutoComplete( keywords, apps.value, objs)
      })

  }, [])


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
        dispatch({type: 'SET_RULES', name: 'rules', value: parseRules(scienceRules)})
      })
      .catch((error) => {
        setInitError(error)
      })
  }, [jobID])


  const getYaml = useCallback(() => {
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
      scienceRules: // todo(nc): refactor the distinction between actions
        [...Object.keys(rules)
          .filter(id => id != 'publishOrSet')
          .map(appID => {
            const obj = rules[appID],
              ruleList = obj.rules

            if (!ruleList?.length)
              return null

            return createRules(appParams[appID]?.appName || appIDToName(appID), 'schedule', ruleList, obj.logics)
          }).filter(s => !!s),
        ...Object.keys(rules)
          .flatMap(appID => {
            const obj = rules[appID],
              ruleList = obj.rules?.filter(obj => 'publish' in obj)

            if (!ruleList?.length)
              return []

            return createRules(appParams[appID]?.appName || appIDToName(appID), 'publish', ruleList, obj.logics)
          }),
        ...Object.keys(rules)
          .flatMap(appID => {
            const obj = rules[appID],
              ruleList = obj.rules?.filter(obj => 'stateKey' in obj)

            if (!ruleList?.length)
              return []


            return createRules(appParams[appID]?.appName || appIDToName(appID), 'set', ruleList, obj.logics)
          })
        ],
      successCriteria: [`WallClock('${successCriteria.amount}${successCriteria.unit}')`]
    })
  }, [appParams, apps, argStyles, name, nodes, rules, successCriteria.amount, successCriteria.unit])

  useEffect(() => {
    handleUpdateEditor(getYaml())
  }, [view, getYaml])


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

  const handleCopyEditor = () => {
    navigator.clipboard.writeText(getYaml())
  }

  const handleSubmit = () => {
    setError(null)
    setSubmitting(true)
    const spec = view == 'form' ? getYaml() : editorState.content
    SES.submitJob(spec)
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

  const handleUpdateEditor = (val: string) => {
    let json
    // disable submit if yaml can't be parsed
    try {
      json = YAML.parse(val)
      setEditorMsg('')
    } catch {
      setEditorMsg('Not valid YAML')
    }

    setEditorState({content: val, json})
  }

  const disableFormSubmit = () =>
    !(user && name && apps.length && nodes.length && rules.length)

  const disableEditorSubmit = () => {
    const {name, plugins, nodes, scienceRules} = editorState.json || {}

    // basic check on node strings
    const validVSNs = nodes && typeof nodes === 'object' &&
      Object.keys(nodes).filter(vsn => vsn.length == 4).length > 0

    return !validVSNs || !(name && plugins?.length && scienceRules?.length)
  }

  return (
    <Root>
      <CardViewStyle/>
      <main className="flex column gap">
        <div className="flex space-between gap">
          <h1>
            <Link to="/jobs/my-jobs">My jobs</Link> / Create job (Science Goal)
          </h1>
          <Notice className="flex ">
            {view == 'form' &&
              <Alert severity="info">
                <b>Note:</b> the create and recreate job form is currently an
                <b> experimental feature</b> and in the <b>early stages of development</b>.{' '}
                <a href="https://docs.waggle-edge.ai/docs/tutorials/schedule-jobs" target="_blank" rel="noreferrer">
                  Read more...
                </a>
              </Alert>
            }
          </Notice>
        </div>

        <Tabs
          value={view}
          aria-label="job status tabs"
          onChange={(_, val) => setView(val)}
          sx={{borderBottom: '1px solid #cfcfcf'}}
        >
          <Tab
            label={<div className="flex items-center"><FormEditorIcon/>&nbsp;Form</div>}
            value="form"
            component={Link}
            to={`/create-job?tab=form${jobID ? `&start_with_job=${jobID}` : ''}`}
            replace
          />
          <Tab
            label={
              <div className="flex items-center">
                <EditorIcon />&nbsp;Editor
              </div>
            }
            value="editor"
            component={Link}
            to={`/create-job?tab=editor${jobID ? `&start_with_job=${jobID}` : ''}`}
            replace
          />
        </Tabs>

        {view == 'editor' &&
          <>
            <EditorContainer className="flex">
              <TextEditor
                value={editorState.content}
                onChange={handleUpdateEditor}
              />
              <EditorOpts>
                <CopyBtn tooltip="Copy YAML" onClick={handleCopyEditor} />
              </EditorOpts>
            </EditorContainer>
            {editorMsg}
          </>
        }

        {view == 'form' &&
          <div className="flex column gap">
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
              <StepTitle icon="4"
                label={<div>
                Create rules
                  <Tooltip
                    title="Read docs..."
                  >
                    <sup>
                      <a href="https://github.com/waggle-sensor/edge-scheduler/tree/main/docs/sciencerules"
                        target="_blank" rel="noreferrer">
                        <HelpOutlineRounded fontSize="small"/>
                      </a>
                    </sup>
                  </Tooltip>
                </div>}
              />
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
              <StepTitle icon="5" label="Provide success criteria" />
              <Step>
                <SuccessBuilder apps={apps} {...successCriteria} onChange={handleSuccessUpdate}/>
              </Step>
            </Card>
          </div>
        }

        <div>
          <Button
            onClick={handleSubmit}
            variant="contained"
            color="primary"
            disabled={
              (view == 'form' ? disableFormSubmit() : disableEditorSubmit()) || submitting
            }
          >
            {submitting ? 'Submitting...' : 'Submit Job'}
          </Button>
        </div>


        {error && !submitting &&
          <ErrorMsg>{error.message}</ErrorMsg>
        }

        {view == 'form' &&
          <div>
            <h2>Or, use the following spec with the Edge Scheduler (ES)</h2>
            <Clipboard content={getYaml()} />
          </div>
        }
      </main>


      {initError &&
        <ConfirmationDialog
          title=""
          content={
            <div>
              <h2>The job form could not be fully initialized with all previously supplied params</h2>

              <h3>Reason:</h3>
              {initError}
            </div>
          }
          onConfirm={() => setInitError(null)}
          onClose={() => setInitError(null)} />
      }
    </Root>
  )
}


const Root = styled.div`
  margin: 0 auto;
  max-width: 1200px;
  padding-bottom: 200px;

  main {
    margin: 0 20px;

    h1 {
      width: 50%;
      white-space: nowrap;
      margin-bottom: 0;
    }
  }

  // override for card styling
  .step-content {
    margin-bottom: 0;
  }

  .new-badge {
  }
`

const Notice = styled.div`
  margin: 10px 0 0 200px;
`

const EditorContainer = styled.div`
  position: relative;
  height: 50vh;
  width: 70vw;
`

const EditorOpts = styled.div`
  position: absolute;
  right: -40px;
`
