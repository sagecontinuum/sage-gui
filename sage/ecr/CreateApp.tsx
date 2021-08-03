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
import TagIcon from '@material-ui/icons/LocalOfferOutlined'

import CaretIcon from '@material-ui/icons/ExpandMoreRounded'

import * as YAML from 'yaml'
import { useSnackbar } from 'notistack'

import ConfigForm from './ConfigForm'
import FilterMenu from '../../components/FilterMenu'
import CheckBox from '../../components/input/Checkbox'

import {Tabs, Tab} from '../../components/tabs/Tabs'
import * as Auth from '../../components/auth/auth'
import * as ECR from '../apis/ecr'
import FormControlLabel from '@material-ui/core/FormControlLabel'

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

  // app repo
  const [repoURL, setRepoURL] = useState('')
  const [tag, setTag] = useState({id: 'main', label: 'main'})
  const [tagList, setTagList] = useState([])

  // app config state
  const [form, setForm] = useState<ECR.AppConfig>(initialState)
  const [config, setConfig] = useState<string>(YAML.stringify(initialState))
  const [configType, setConfigType] = useState<'yaml'|'json'|'none'|string>(null)

  const [validating, setValidating] = useState(false)
  const [isValid, setIsValid] = useState(null)

  const [isRegistering, setIsRegistering] = useState(false)
  const [isBuilding, setIsBuilding] = useState(false)
  const [error, setError] = useState(null)


  // debug settings
  const [devMode, setDevMode] = useState(false)


  // remove all verification/error state on changes
  useEffect(() => {
    setError(null)
  }, [repoURL, config])


  // if repo url changes, force user to reverify
  useEffect(() => {
    setIsValid(null)
  }, [repoURL])



  const onRepoVerify = (evt = null) => {
    if (evt) evt.preventDefault()

    const path = repoURL.split('.com')[1]
      .replace('.git', '').slice(1)

    // todo: add rate limit notice, add branch?
    setValidating(true)
    fetch(`${GITHUB_API}/repos/${path}`)
      .then(res => {
        setIsValid(res.ok)
        return res.json()
      }).then(data => {
        // set branch dropdown to github default branch
        const t = data.default_branch
        setTag({id: t, label: t})

        // fetch branches for dropdown (this will be tags in future?)
        fetch(data.branches_url.replace('{/branch}', ''))
          .then(res => res.json())
          .then(branches => {
            const opts = branches.map(b => b.name).map(name => ({id: name, label: name}))
            setTagList(opts)
          })
      })
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
          let obj = YAML.parse(text)
          obj = sanitizeForm(obj)

          // update config with repo url and tag (just branch for now)
          obj.source.url = repoURL
          obj.source.branch = tag.id

          setForm(obj)
          setConfig(YAML.stringify(obj))
        })
      }).catch(() => setConfigType('none'))
  }


  const onRepoTagChange = (tagObj) => {
    if (!tagObj) {
      setIsValid(false)
      return
    }

    setTag(tagObj)
    setIsValid(true)

    const f = {...form}
    f.source.branch = tagObj.id
    setForm(f)
    setConfig(YAML.stringify(f))
  }


  const sanitizeForm = (obj) => {
    return {...obj, namespace: username}
  }


  const onRegister = () => {
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


  const onBuild = () => {
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


  const onExampleOne = () => {
    setConfig('')
    setRepoURL(EXAMPLE_REPO_1)
  }


  const onUpdateForm = (event, val?: string) => {
    const {name, value} = event.target

    let f
    if (name == 'architectures') {
      f = {...form}
      const archList = f.source.architectures
      f.source.architectures = event.target.checked ?
        [...archList, val] : archList.filter(v => v != val)
    } else {
      f = {...form, [name]: value}
    }

    setForm(f)
    setConfig(YAML.stringify(f))
  }


  const onEditorChange = (evt) => {
    const text = evt.target.value
    setConfig(text)

    let obj = YAML.parse(text)
    obj = sanitizeForm(obj)
    setForm(obj)
  }



  return (
    <Root>
      <Main>
        <h1>Create App</h1>

        <StepTitle icon="1" active={true} label="Specify Repo URL"/>

        <form className="step step-1 gap" onSubmit={onRepoVerify}>
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

          {isValid &&
            <FilterMenu
              options={tagList}
              multiple={false}
              onChange={onRepoTagChange}
              value={tag}
              headerText="Select a different branch"
              ButtonComponent={
                <Button style={{marginLeft: 10}} startIcon={<TagIcon/>}>
                  {tag?.id}
                  <CaretIcon />
                </Button>
              }
            />
          }

          {repoURL && !isValid &&
            <Button
              onClick={onRepoVerify}
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


        <StepTitle icon="2" active={true} label="Set App Configuration" />

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

          <Tabs
            value={tabIndex}
            onChange={(_, idx) => setTabIndex(idx)}
            aria-label="App Configuration Tabs"
          >
            <Tab label="Form" idx={0} />
            <Tab label="Raw Config" idx={1} />
          </Tabs>

          {tabIndex == 0 &&
            <ConfigForm
              form={form}
              onChange={onUpdateForm}
            />
          }

          {tabIndex == 1 &&
            <EditorContainer>
              <Editor
                value={config}
                onChange={onEditorChange}
              />
            </EditorContainer>
          }

          {error &&
            <FormHelperText style={{fontSize: '1.1em'}} error>{error}</FormHelperText>
          }
        </div>


        <div className="step">
          <Button
            onClick={onRegister}
            variant="outlined"
            color="primary"
            disabled={!isValid || !form || isRegistering || isBuilding || error}
          >
            {isRegistering ? 'Registering...' : 'Register App'}
          </Button>

          <Button
            onClick={onBuild}
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

        {/* when in debug mode*/}
        {devMode &&
          <Debug form={form} />
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
  margin-top: 10px;
`

const Editor = styled.textarea`
  height: 400px;
  width: 100%;
  border: 1px solid #ccc;
  padding: 5px 10px;
`

const Help = styled.div`
  margin: 20px 0;
  flex-grow: 1;
  max-width: 300px;
`


const DebugOptions = styled.div`
  margin-top: 75px;
`


function Debug(props) {
  const {form} = props

  return (
    <DebugRoot>
      <h4>Form State (Debug Mode)</h4>
      <pre
        className="code"
        dangerouslySetInnerHTML={{__html: JSON.stringify(form, null, 2).replace(/\\n/g, '<br/>')}}
      />
    </DebugRoot>
  )
}


const DebugRoot = styled.div`
  pre {
    overflow: scroll;
    font-size: .7em;
  }
`