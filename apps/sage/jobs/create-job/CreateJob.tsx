import { useCallback, useEffect, useReducer, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import styled from 'styled-components'

import { TextField, Button, Alert, Tooltip, Autocomplete, Popper, Box } from '@mui/material'
import FormEditorIcon from '@mui/icons-material/FormatListNumberedRounded'
import EditorIcon from '@mui/icons-material/DataObjectRounded'
import LaunchIcon from '@mui/icons-material/LaunchRounded'
import HelpOutlineRounded from '@mui/icons-material/HelpOutlineRounded'

import Clipboard from '/components/utils/Clipboard'
import { Step, StepTitle } from '/components/layout/FormLayout'
import { Card, CardViewStyle } from '/components/layout/Layout'
import { Tabs, Tab } from '/components/tabs/Tabs'
import CopyBtn from '/components/utils/CopyBtn'
import ConfirmationDialog from '/components/dialogs/ConfirmationDialog'

import AppSelector from './AppSelector'
import SelectedAppTable from './SelectedAppTable'
import NodeSelector, { parseNodeMeta } from './NodeSelector'
import RuleBuilder from './RuleBuilder'
import SuccessBuilder from './SuccessBuilder'
import TextEditor, { registerAutoComplete } from './TextEditor'
import sampleYaml from './sample-job'
import { FileFormatDot } from '/apps/sage/data-commons/FileFormatDot'

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

import * as ECR from '/components/apis/ecr'
import * as BK from '/components/apis/beekeeper'
import * as User from '/components/apis/user'
import * as SES from '/components/apis/ses'
import Auth from '/components/auth/auth'

import config from '/config'
import ErrorMsg from '../../ErrorMsg'

import pluginGif from 'url:./gifs/plugin.gif'

const { dockerRegistry, docs, contactUs } = config


type View = 'form' |'editor'

// todo(nc): actually use State/Action types
type State = {
  name: ''
  apps: ECR.App[]
  nodes: BK.VSN[]
  rules: {
    [app: string]: {
      rules: Rule[]
      logics: BooleanLogic[]
    }
  }
}

type Action = {type: 'SET', name: string, value: string | ECR.App[] | BK.NodeMeta[] }


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

  const [params, setParams] = useSearchParams()
  const jobID = Number(params.get('start_with_job'))
  const startWithSample = params.get('start_with_sample')
  const tab = params.get('tab') as View || 'editor'

  const [{name, apps, nodes, rules}, dispatch] = useReducer(reducer, initState)

  const [appParams, setAppParams] = useState<ParsedPlugins['params']>({})

  // note: we can't infer CLI convention unless there were some params provided :()
  const [argStyles, setArgStyles] = useState<ArgStyles>({})
  const [successCriteria, setSuccessCriteria] = useState({amount: 1, unit: 'day'})

  const [submitting, setSubmitting] = useState<boolean>(false)
  const [confirmOverwrite, setConfirmOverwrite] = useState<boolean>(false)
  const [error, setError] = useState(null)
  const [initError, setInitError] = useState(null)

  const [editorState, setEditorState] = useState<{content: string, json: SES.JobTemplate}>({})
  const [editorMsg, setEditorMsg] = useState('')
  const [jobs, setJobs] = useState<SES.Job[]>()
  const [viewTips, setViewTips] = useState<boolean>(false)



  // load additional data for editor
  useEffect(() => {
    if (tab !== 'editor')
      return

    // jobs for job selector
    SES.getJobs()
      .then(jobs => setJobs(jobs))

    // meta for auto complete
    const p1 = ECR.listApps('public')
    const p2 = BK.getNodeDetails()
    const p3 = User.listNodesWithPerm('schedule')

    Promise.allSettled([p1, p2, p3])
      .then(([apps, nodes, schedulable]) => {
        nodes = parseNodeMeta(nodes.value)

        let availNodes
        if (schedulable.status == 'fulfilled') {
          availNodes = nodes.filter(o => schedulable.value.includes(o.vsn))
        }

        const keywords = [...aggFuncs, 'rate', 'v']
        registerAutoComplete(keywords, apps.value, nodes, availNodes)
      })
  }, [tab])


  // if needed, initialize form with job spec
  useEffect(() => {
    if (!jobID || tab == 'editor') return

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
  }, [jobID, tab])


  // if needed, initialize editor with sample
  useEffect(() => {
    if (tab != 'editor' || !startWithSample) return

    setTimeout(() => handleUpdateEditor(sampleYaml))
  }, [startWithSample, tab])


  // if needed, initialize editor with job spec
  useEffect(() => {
    if (!jobID || tab != 'editor') return

    SES.getTemplate(jobID, 'yaml')
      .then((yaml) => handleUpdateEditor(yaml))
      .catch((error) => setInitError(error))
  }, [jobID, tab])


  // todo(nc): this clean this up. namely the science rules
  const getYaml = useCallback(() => {
    return YAML.stringify({
      name,
      plugins:
        apps.map(o => {
          const argStyle = o.id in argStyles ? argStyles[o.id] : '-'

          return {
            name: appParams[o.id]?.appName || appIDToName(o.id),
            pluginSpec: {
              image: `${dockerRegistry}/${o.id}`,
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
  }, [tab, getYaml, jobID, startWithSample])


  const handleAppSelection = (value: ECR.App[]) => {
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
    navigator.clipboard.writeText(editorState.content)
  }

  const handleSubmit = () => {
    setError(null)
    setSubmitting(true)
    const spec = tab == 'form' ? getYaml() : editorState.content
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

  const handleOverwrite = () => {
    setError(null)
    setSubmitting(true)
    const spec = editorState.content
    return SES.editJob(jobID, spec)
      .then(() => {
        enqueueSnackbar(
          <>
            Job successfully overwritten!
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

  const handleUpdateEditor = (val: string /* yaml */) => {
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

  const handleSelectJob = (job) => {
    if (!job) params.delete('start_with_job')
    else params.set('start_with_job', job.job_id)

    params.delete('start_with_sample')
    setParams(params, {replace: true})
  }

  const handleUseSample = () => {
    params.delete('start_with_job')
    params.set('start_with_sample', 'true')
    setParams(params, {replace: true})
  }

  const handleTabChange = (tab: View) => {
    params.set('tab', tab)
    setParams(params, {replace: true})
  }

  const handleReviewSpec = () => {
    params.set('tab', 'editor')
    setParams(params, {replace: true})
  }

  const getJobName = (id: SES.Job['job_id']) =>
    jobs?.find(o => o.job_id == id)?.name


  const disableFormSubmit = () =>
    !Auth.user || !(name && apps.length && nodes.length && rules.length)

  const disableEditorSubmit = () => {
    const {name, plugins, nodes, scienceRules} = editorState.json || {}

    // basic check on node strings
    const validVSNs = nodes && typeof nodes === 'object' &&
      Object.keys(nodes).filter(vsn => vsn.length == 4).length > 0

    return !Auth.user || !validVSNs || !(name && plugins?.length && scienceRules?.length)
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
            {tab == 'form' &&
              <Alert severity="info">
                <b>Note:</b> the create and recreate job form is currently an
                <b> experimental feature</b> and in the <b>early stages of development</b>.{' '}
                <a href={`${config.docs}/tutorials/schedule-jobs`} target="_blank" rel="noreferrer">
                  Read more...
                </a>
              </Alert>
            }
          </Notice>
        </div>

        <Tabs
          value={tab}
          aria-label="job status tabs"
          onChange={(_, val) => handleTabChange(val)}
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

        {tab == 'editor' &&
          <>
            <EditorContainer className="flex gap">
              <div className="flex" style={{width: '100%'}}>
                <TextEditor
                  value={editorState.content}
                  onChange={handleUpdateEditor}
                />
              </div>
              <EditorOpts className="flex column gap">
                <div className="flex items-center gap">
                  <Autocomplete
                    options={jobs || []}
                    getOptionLabel={(opt) =>  {
                      return `${opt.name} (${opt.job_id})`
                    }}
                    renderInput={(props) =>
                      <TextField {...props}
                        label="Start with job"
                        placeholder="Search jobs..."
                        InputLabelProps={{ shrink: true }}
                        inputProps={{
                          ...props.inputProps
                        }}
                      />
                    }
                    renderOption={(props, opt) => {
                      const status = (opt.state.last_state.toLowerCase() || '-')

                      return (
                        <Box component="li" {...props}>
                          <div className="flex column">
                            <b>{opt.name}</b>
                            <div className="flex muted">
                              job {opt.job_id}&nbsp;|&nbsp;{opt.user}&nbsp;&nbsp;&nbsp;
                              {status == 'running' ?
                                <FileFormatDot format={status} /> : `(${status})`}
                            </div>
                          </div>
                        </Box>
                      )
                    }}
                    PopperComponent={(props) => <Popper {...props} sx={{minWidth: 300}} />}
                    value={jobs ? jobs.find(o => o.job_id == jobID) : null}
                    onChange={(evt, val) => handleSelectJob(val)}
                    sx={{width: '200px'}}
                  />
                  <span className="nowrap">
                    or, <a onClick={handleUseSample}>use sample</a>
                  </span>
                </div>
                <div>
                  <h3>Docs</h3>
                  <hr/>
                  <ul className="no-padding list-none">
                    <li>
                      <a href={`${docs}/tutorials/schedule-jobs`} target="_blank" rel="noreferrer" >
                        Submit your job
                        <LaunchIcon className="external-link"/>
                      </a>
                    </li>
                    <li>
                      <a href={contactUs} target="_blank" rel="noreferrer" >
                        Contact us
                        <LaunchIcon className="external-link"/>
                      </a>
                    </li>
                  </ul>
                  <h3>Help</h3>
                  <hr/>
                  <ul className="no-padding list-none">
                    <li>
                      <a onClick={() => setViewTips(true)}>
                        View tips...
                      </a>
                    </li>
                  </ul>
                </div>

                <CopyContainer>
                  <CopyBtn tooltip="Copy YAML" onClick={handleCopyEditor} />
                </CopyContainer>
              </EditorOpts>
            </EditorContainer>
            {editorMsg}
          </>
        }

        {tab == 'form' &&
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

        <div className="flex items-center gap">
          {tab == 'form' &&
            <Button
              onClick={handleReviewSpec}
              variant="contained"
              color="primary"
              disabled={disableFormSubmit() || submitting
              }
            >
              {submitting ? 'Submitting...' : 'Review job submission'}
            </Button>
          }

          {tab == 'editor' && !jobID ?
            <Button
              onClick={handleSubmit}
              variant="contained"
              color="primary"
              disabled={disableEditorSubmit() || submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Job'}
            </Button>
            :
            <>
              <Button
                onClick={handleSubmit}
                variant="contained"
                color="primary"
                disabled={disableEditorSubmit() || submitting}
              >
                {submitting ? 'Submitting...' : 'Submit as New Job'}
              </Button>
              <Button
                onClick={() => setConfirmOverwrite(true)}
                variant="outlined"
                disabled={disableEditorSubmit() || submitting}
                className="danger"
              >
                {submitting ? 'Submitting...' : `Overwrite Existing Job: ${getJobName(jobID)}`}
              </Button>
            </>
          }

          {!Auth.user &&
            <div><b>Note:</b> Sign in is required to use this service.</div>
          }
        </div>


        {error && !submitting &&
          <ErrorMsg>{error.message}</ErrorMsg>
        }

        {tab == 'form' &&
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

      {viewTips &&
        <ConfirmationDialog
          title="Tips for using the editor"
          maxWidth='lg'
          content={
            <div>
              Every job must have a <b>name</b> and <b>at least one of each of the following</b>:
              <ul>
                <li>plugin</li>
                <li>node</li>
                <li>science rule</li>
              </ul>

              <p>
                Use keywords such as <b>plugin</b>, <b>node</b>, and <b>scienceRule</b> to
                create jobs faster
              </p>
              <img src={pluginGif} />
            </div>
          }
          onConfirm={() => setViewTips(false)}
          onClose={() => setViewTips(false)} />
      }

      {confirmOverwrite &&
        <ConfirmationDialog
          title={<div>Overwrite job "{getJobName(jobID)}"?</div>}
          content={
            <Alert severity="warning">
              The job <b>{getJobName(jobID)}</b> (job id {jobID}) will be <b>overwritten</b>.<br/>
              The previous job sumbmission specification <b>will be lost!</b>
            </Alert>
          }
          confirmBtnText="OK, Overwrite It!"
          confirmBtnStyle={{background: '#c70000'}}
          onConfirm={handleOverwrite}
          onClose={() => setConfirmOverwrite(false)}
        />
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
  height: 60vh;
  width: 80vw;
`

const EditorOpts = styled.div`
  position: relative;
`

const CopyContainer = styled.div`
  position: absolute;
  bottom: 0;
`
