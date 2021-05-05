import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import styled from 'styled-components'

import { withStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import StepIcon from '@material-ui/core/StepIcon'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import Button from '@material-ui/core/Button'
import Tooltip from '@material-ui/core/Tooltip'
import FormHelperText from '@material-ui/core/FormHelperText'
import CheckIcon from '@material-ui/icons/Check'
import LaunchIcon from '@material-ui/icons/LaunchRounded'
import HelpIcon from '@material-ui/icons/HelpOutlineRounded'

import Editor from '@monaco-editor/react'
import jsyaml from '../../node_modules/js-yaml/dist/js-yaml'

import ConfigForm from './ConfigForm'

import { useSnackbar } from 'notistack'

import * as ECR from '../apis/ecr'


const GITHUB_API = 'https://api.github.com'
const GITHUB_STATIC_URL = 'https://raw.githubusercontent.com'

// Todo: need better examples
const EXAMPLE_REPO_1 = 'https://github.com/waggle-sensor/plugin-helloworld-ml'
// const EXAMPLE_REPO_2 = 'https://github.com/waggle-sensor/plugin-helloworld-ml'
// const EXAMPLE_REPO_3 = 'https://github.com/nconrad/plugin-helloworld-ml'



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


const CustomTabs = withStyles((theme) => ({
  root: {
    borderBottom: '1px solid #e8e8e8',
  },
  indicator: {
    backgroundColor: theme.palette.primary.main
  },
}))(Tabs)


const CustomTab = withStyles((theme) => ({
  root: {
    textTransform: 'none',
    minWidth: 72,
    fontWeight: theme.typography.fontWeightRegular,
    marginRight: theme.spacing(4),
    '&:hover': {
      color: '#222',
      opacity: 1,
    },
  },
  selected: {},
}))((props) => <Tab disableRipple {...props} />)



function a11yProps(index) {
  return {
    id: `tab-${index}`,
    'aria-controls': `tabpanel-${index}`,
  }
}


const initialState = {
  name: '',
  description: '',
  version: '',
  namespace: '',
  source: {
    architectures: []
  },
  url: '',
  directory: '',
  resources: [
    {type: '', view: '', min_resolution: ''}
  ],
  inputs: [
    {id: 'speed', type: 'int'}
  ],
  metadata: {}
}




export default function CreateApp() {
  let history = useHistory()
  const { enqueueSnackbar } = useSnackbar()

  const [tabIndex, setTabIndex] = useState(0)

  // app config state
  const [repoURL, setRepoURL] = useState('')
  const [form, setForm] = useState<ECR.AppConfig>(initialState)
  const [config, setConfig] = useState<string>(jsyaml.dump(initialState))
  const [configType, setConfigType] = useState<'yaml'|'json'|'none'|string>(null)

  const [validating, setValidating] = useState(false)
  const [isValid, setIsValid] = useState(null)

  const [isRegistering, setIsRegistering] = useState(false)
  const [isBuilding, setIsBuilding] = useState(false)
  const [error, setError] = useState(null)


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

        // set config text
        res.text().then(text => {
          setConfig(text)
          const obj = jsyaml.load(text)

          setForm(obj)
        })
      }).catch(() => setConfigType('none'))
  }


  const handleTabChange = (evt, val) => {
    setTabIndex(val)
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


  const handleConfigChange = (val) => {
    const obj = jsyaml.load(val)
    setForm(obj)
    setConfig(val)
  }

  const onExampleOne = () => {
    setConfig('')
    setRepoURL(EXAMPLE_REPO_1)
  }


  // Todo: for demonstration, there's an error in example 1
  const onExampleTwo = async () => {
    setConfig('')
    setRepoURL(EXAMPLE_REPO_2)
  }

  /*
  const onExampleThree = () => {
    setConfig(null)
    setRepoURL(EXAMPLE_REPO_3)
  }
  */

  const handleFormChange = (state) => {
    setForm(state)
    setConfig(jsyaml.dump(state))
  }



  return (
    <Root>
      <Main>

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

          <CustomTabs value={tabIndex} onChange={handleTabChange} aria-label="App Configuration Tabs">
            <CustomTab label="Form" {...a11yProps(0)} />
            <CustomTab label="Raw Config" {...a11yProps(1)} />
            {/*<CustomTab label="Preview" {...a11yProps(2)} />*/}
          </CustomTabs>


          {tabIndex == 0 &&
            <ConfigForm form={form} onChange={handleFormChange} />
          }


          {/* here we preload the editor */}
          <EditorContainer style={{display: tabIndex == 1 ? 'block' : 'none'}}>
            <Editor
              height="400px"
              defaultLanguage="yaml"
              value={config}
              onChange={handleConfigChange}
              theme="light"
            />
          </EditorContainer>


          {error &&
            <FormHelperText style={{fontSize: '1.1em'}} error>{error}</FormHelperText>
          }
        </div>


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
            <a href="https://github.com/waggle-sensor/plugin-helloworld-ml/blob/master/README.md" target="_blank" rel="noreferrer" >
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
      </Help>
    </Root>
  )
}

const Root = styled.div`
  display: flex;
  margin-top: 50px;
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
  flex-grow: 1;
`
