import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import styled from 'styled-components'

import TextField from '@material-ui/core/TextField'
import StepIcon from '@material-ui/core/StepIcon'
import Button from '@material-ui/core/Button'
import Tooltip from '@material-ui/core/Tooltip'
import FormHelperText from '@material-ui/core/FormHelperText'
import CheckIcon from '@material-ui/icons/Check'
import LaunchIcon from '@material-ui/icons/LaunchRounded'
import HelpIcon from '@material-ui/icons/HelpOutlineRounded'

import Editor from '@monaco-editor/react'
import { parse, stringify } from 'yaml'
import { useSnackbar } from 'notistack'

import ConfigForm from './ConfigForm'

import {Tabs, Tab} from '../../components/tabs/Tabs'
import * as Auth from '../../components/auth/auth'
import * as ECR from '../apis/ecr'
const username = Auth.getUser()

const devList = [
  'nconrad',
  'wgerlach',
  'gemblerz',
  'seanshahkarami',
  'jswantek'
]

const isDevUser = devList.includes(username)


const GITHUB_API = 'https://api.github.com'
const GITHUB_STATIC_URL = 'https://raw.githubusercontent.com'
const EXAMPLE_REPO_1 = 'https://github.com/waggle-sensor/plugin-helloworld-ml'


function StepTitle(props) {
  return (
    <StepRoot>
      <StepIcon {...props}/> <span>{props.label}</span>
    </StepRoot>
  )
}

const StepRoot = styled.div`
  display: flex;
  align-items: center;
  font-weight: bold;
  margin-bottom: 10px;
  .MuiStepIcon-root {
    margin-right: 5px;
  }
`


const initialState = {
  name: '',
  description: '',
  version: '',
  namespace: username,
  source: {
    architectures: [],
    branch: '',
    directory: '',
    dockerfile: '',
    url: '',
  },
  url: '',
  directory: '',
  resources: [],
  inputs: [],
  metadata: {}
}



export default function CreateApp() {
  let history = useHistory()
  const { enqueueSnackbar } = useSnackbar()

  const [tabIndex, setTabIndex] = useState(0)

  // app config state
  const [repoURL, setRepoURL] = useState('')
  const [form, setForm] = useState<ECR.AppConfig>(initialState)
  const [config, setConfig] = useState<string>(stringify(initialState))
  const [configType, setConfigType] = useState<'yaml'|'json'|'none'|string>(null)

  const [validating, setValidating] = useState(false)
  const [isValid, setIsValid] = useState(null)

  const [isRegistering, setIsRegistering] = useState(false)
  const [isBuilding, setIsBuilding] = useState(false)
  const [error, setError] = useState(null)


  useEffect(() => {
    fetch(`${ECR.url}/permissions/`)
      .then(res => {
        return res.json()
      }).then((data) => {
        console.log(data)
      })
  }, [])

  // remove all verification/error state on changes
  useEffect(() => {
    setError(null)
  }, [repoURL, config])


  const handleRepoVerify = (evt = null) => {
    if (evt) evt.preventDefault()

    const path = repoURL.split('.com')[1]
      .replace('.git', '').slice(1)

    // todo: add rate limit notice, add branch?
    setValidating(true)
    fetch(`${GITHUB_API}/repos/${path}`)
      .then(res => setIsValid(res.ok))
      .catch(() => setIsValid(false))
      .then(() => setValidating(false))
      .then(() => fetch(`${GITHUB_STATIC_URL}/${path}/master/sage.json`))
      .then(res => res.status == 404 ?
        fetch(`${GITHUB_STATIC_URL}/${path}/master/sage.yaml`) : res
      ).then(res => {

        // set config type
        const type = res.status == 404 ?
          'none' : res.url.slice(res.url.lastIndexOf('.') + 1)
        setConfigType(type)

        // set form/config
        res.text().then(text => {
          let obj = parse(text)
          obj = sanitizeForm(obj)
          setConfig(stringify(obj))
          setForm(sanitizeForm(obj))
        })
      }).catch(() => setConfigType('none'))
  }

  const sanitizeForm = (obj) => {
    return {...obj, namespace: username}
  }

  const handleRegister = () => {
    setIsRegistering(true)
    ECR.register(config)
      .then(() => {
        enqueueSnackbar('App registered', {variant: 'success'})
        history.push('/apps/my-apps')
      }).catch(error => {
        if (error.message.includes('force=true')) {
          // todo: implement overwrite
        }
        setError(error.message)
      }).finally(() => setIsRegistering(false))
  }


  const handleBuild = () => {
    setIsBuilding(true)

    const {namespace, name, version} = form
    ECR.registerAndBuild({namespace, name, version}, config)
      .then(() => {
        enqueueSnackbar('Build started')
        history.push('/apps/my-apps')
      }).catch(error => {
        setError(error.message)
      }).finally(() => setIsBuilding(false))
  }



  const handleFormChange = (obj: ECR.AppConfig) => {
    obj = sanitizeForm(obj)
    setForm(obj)
    setConfig(stringify(obj))
  }

  const handleEditorChange = (text: string) => {
    let obj = parse(text)
    obj = sanitizeForm(obj)
    setForm(obj)
    setConfig(stringify(obj))
  }


  const onExampleOne = () => {
    setConfig('')
    setRepoURL(EXAMPLE_REPO_1)
  }


  /*
  const onExampleTwo = async () => {
    setConfig('')
    setRepoURL(EXAMPLE_REPO_2)
  }

  const onExampleThree = () => {
    setConfig(null)
    setRepoURL(EXAMPLE_REPO_3)
  }
  */



  return (
    <Root>
      <Main>
        <h1>Create App</h1>
        <StepTitle icon="1" active={true} label="Specify Repo URL"/>
        <form className="step step-1" onSubmit={handleRepoVerify}>
          <TextField
            label="GitHub Repo URL"
            placeholder="https://github.com/me/my-edge-app"
            value={repoURL}
            onChange={evt => setRepoURL(evt.target.value)}
            error={isValid == false}
            helperText={isValid == false ? 'Sorry, we could not verify github repo url' : ''}
            style={{width: 500}}
            InputLabelProps={{ shrink: true }}
          />

          {repoURL &&
            <Button
              onClick={handleRepoVerify}
              variant="contained"
              color="primary"
            >
              {validating ? 'Validating...' : 'Verify'}
            </Button>
          }

          {isValid &&
            <CheckIcon className="success" />
          }
        </form>


        <StepTitle icon="2" active={true} label="Configuration" />
        <div className="step">
          {configType == 'none' &&
            <p>
              No <span className="code">sage.yaml</span> or <span className="code">sage.json</span> configuration file found.
              <sup>
                <Tooltip title="Sage app configuration files can be stored in your repo and loaded here.  (Click for help)">
                  <HelpIcon fontSize="small" />
                </Tooltip>
              </sup>
            </p>
          }

          <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} aria-label="App Configuration Tabs">
            <Tab label="Form" idx={0} />
            <Tab label="Raw Config" idx={1} />
          </Tabs>

          {tabIndex == 0 &&
            <ConfigForm form={form} onChange={handleFormChange} />
          }

          {/* here we preload the editor */}
          <EditorContainer style={{display: tabIndex == 1 ? 'block' : 'none'}}>
            <Editor
              height="400px"
              defaultLanguage="yaml"
              value={config}
              onChange={handleEditorChange}
              theme="light"
            />
          </EditorContainer>


          {error &&
            <FormHelperText style={{fontSize: '1.1em'}} error>{error}</FormHelperText>
          }
        </div>

        {/* when in debug mode*/}
        {devMode &&
          <Debug form={form} />
        }

        <div className="step">
          <Button
            onClick={handleRegister}
            variant="outlined"
            color="primary"
            disabled={!isValid || !form || isRegistering || isBuilding || error}
          >
            {isRegistering ? 'Registering...' : 'Register App'}
          </Button>

          <Button
            onClick={handleBuild}
            variant="contained"
            color="primary"
            disabled={!isValid || !form || isRegistering || isBuilding || error}
          >
            {isBuilding ? 'Submitting...' : 'Register & Build App'}
          </Button>
        </div>
      </Main>


      <Help>
        <h3 className="no-margin">Help</h3>
        <hr/>
        <ul className="no-padding list-none">
          <li>
            <a href="/docs/Hello-World-Plugin" target="_blank" rel="noreferrer" >
              Getting Started
              <LaunchIcon className="external-link"/>
            </a>
          </li>
        </ul>
        <ul className="no-padding list-none">
          <li><a onClick={onExampleOne}>Use Helloworld ML</a></li>
          {/*<li><a onClick={onExampleTwo}>Use Example Two</a></li>*/}
          {/*<li><a onClick={onExampleThree}>Use Example Three</a></li>*/}
        </ul>

        {isDevUser &&
          <DebugOptions>
            <h3 className="no-margin">
              Debugging
              <sup>
                <Tooltip title={`These special debug mode options are only available to: ${devList.join(', ')}`} placement="top">
                  <HelpIcon fontSize="small" />
                </Tooltip>
              </sup>
            </h3>
            <hr/>
            <FormControlLabel
              control={
                <CheckBox
                  checked={devMode}
                  onChange={evt => setDevMode(evt.target.checked)}
                />
              }
              label={<>Show form state</>}
            />
          </DebugOptions>
        }
      </Help>
    </Root>
  )
}

const Root = styled.div`
  display: flex;
  margin: 0 25px;
`

const Main = styled.div`
  flex-grow: 3;

  .step {
    margin: 0px 25px 40px 25px;

    .MuiButton-root {
      margin-right: 10px;
    }
  }

  .step-1 {
    display: flex;
    align-items: center;
    button, svg {
      margin-left: 10px;
    }
  }
`

const EditorContainer = styled.div`
  border: 1px solid #ccc;
`

const Help = styled.div`
  margin: 20px 0;
  flex-grow: 1;
`


const DebugOptions = styled.div`
  margin-top: 75px;
`


function Debug(props) {
  const {form} = props

  return (
    <>
      <h4>Form State (Debug Mode)</h4>
      <pre
        style={{fontSize: '.8em'}}
        className="code"
        dangerouslySetInnerHTML={{__html: JSON.stringify(form, null, 4).replace(/\\n/g, '<br/>')}}
      />
    </>
  )
}