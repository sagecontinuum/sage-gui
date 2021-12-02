import React, { useCallback, useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import styled from 'styled-components'

import TextField from '@mui/material/TextField'
import StepIcon from '@mui/material/StepIcon'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import CheckIcon from '@mui/icons-material/Check'
import LaunchIcon from '@mui/icons-material/LaunchRounded'
import HelpIcon from '@mui/icons-material/HelpOutlineRounded'
import TagIcon from '@mui/icons-material/LocalOfferOutlined'
import FormHelperText from '@mui/material/FormHelperText'

import CaretIcon from '@mui/icons-material/ExpandMoreRounded'

import * as YAML from 'yaml'
import { useSnackbar } from 'notistack'

import ConfigForm from './ConfigForm'
import FilterMenu from '../../../components/FilterMenu'
import CheckBox from '../../../components/input/Checkbox'

import * as Auth from '../../../components/auth/auth'
import * as ECR from '../../apis/ecr'
import FormControlLabel from '@mui/material/FormControlLabel'

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
const EXAMPLE_REPO_2 = 'https://github.com/dariodematties/BirdNET_Plugin'



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


const getRepoPath = (url: string) =>
  url.split('.com')[1].replace('.git', '').slice(1)



const initialState = {
  // namespace: username, // only if supplied?
  // name: '',
  // version: '',
  description: '',
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

  // app repo
  const [repoURL, setRepoURL] = useState('')
  const [repoPath, setRepoPath] = useState('')
  const [branch, setBranch] = useState('main')
  const [branchList, setBranchList] = useState<{id: string, label: string}[]>([])

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


  const fetchSageConfig = useCallback(() => {
    if (!repoURL || !branch) return

    const path = getRepoPath(repoURL)

    fetch(`${GITHUB_STATIC_URL}/${path}/${branch}/sage.yaml`)
      .then(res => res.status == 404 ?
        fetch(`${GITHUB_STATIC_URL}/${path}/${branch}/sage.json`) : res
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
          obj.source.branch = obj.source.branch || branch

          setForm(obj)
          setConfig(YAML.stringify(obj))
        })
      }).catch(() => setConfigType('none'))
  }, [repoURL, branch])


  // remove all verification/error state on changes
  useEffect(() => {
    setError(null)
  }, [repoURL, config])


  // if repo url changes, force user to reverify
  useEffect(() => {
    setIsValid(null)
  }, [repoURL])


  useEffect(() => {
    fetchSageConfig()
  }, [fetchSageConfig] )



  const onRepoVerify = (evt = null) => {
    if (evt) evt.preventDefault()

    const path = getRepoPath(repoURL)

    // todo: add rate limit notice, add branch?
    setValidating(true)
    fetch(`${GITHUB_API}/repos/${path}`)
      .then(res => {
        setIsValid(res.ok)
        return res.json()
      })
      .then(data => {
        // set branch dropdown to github default branch
        const branch = data.default_branch
        setBranch(branch)

        // fetch branches for dropdown (this will be tags in future?)
        fetch(data.branches_url.replace('{/branch}', ''))
          .then(res => res.json())
          .then(branches => {
            const opts = branches.map(b => b.name).map(name => ({id: name, label: name}))
            setBranchList(opts)
          })
      })
      .catch(() => setIsValid(false))
      .then(() => setValidating(false))
  }


  const onRepoBranchChange = (tagObj) => {
    if (!tagObj) {
      setIsValid(false)
      return
    }

    setBranch(tagObj.id)
    setIsValid(true)
    fetchSageConfig()
  }


  const sanitizeForm = (obj) => {
    return {...obj, namespace: username}
  }


  const onRegister = () => {
    setIsRegistering(true)

    const {namespace, name, version} = form
    ECR.register({namespace, name, version}, config)
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


  const onExample = (url) => {
    setConfig('')
    setRepoURL(url)
  }


  const onUpdateForm = (event) => {
    const {name, value} = event.target

    let f = {...form, [name]: value}

    setForm(f)
    setConfig(YAML.stringify(f))
  }



  return (
    <Root>
      <Main>
        <h1>Create App</h1>

        <StepTitle icon="1" active={true} label="Repo URL"/>

        <form className="step step-1 flex items-center gap" onSubmit={onRepoVerify}>
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
              options={branchList}
              multiple={false}
              onChange={onRepoBranchChange}
              value={{id: branch, label: branch}}
              headerText="Select a different branch"
              ButtonComponent={
                <Button style={{marginLeft: 10}} startIcon={<TagIcon/>}>
                  {branch}
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


        <StepTitle icon="2" active={true} label="App Name and Version" />

        <div className="step">
          <ConfigForm
            form={form}
            onChange={onUpdateForm}
          />
        </div>



        {isValid &&
          <div className="step">
            <h4>App Config</h4>
            {configType == 'none' &&
              <p>
                No <span className="code">sage.yaml</span> or <span className="code">sage.json</span> configuration file found.
                Before registering or building your app, please create one following the
                directions <a href="https://github.com/waggle-sensor/pywaggle/blob/main/docs/writing-a-plugin.md#adding-hello-world-plugin-packaging-info" target="_blank" rel="noreferrer"><b>here</b></a>.
              </p>
            }

            {configType != 'none' &&
              <pre className="code">{config}</pre>
            }

            {error &&
              <FormHelperText style={{fontSize: '1.1em'}} error>{error}</FormHelperText>
            }
          </div>
        }

        <div className="step">
          <Button
            onClick={onRegister}
            variant="outlined"
            color="primary"
            disabled={!isValid || configType == 'none' || isRegistering || isBuilding || error}
          >
            {isRegistering ? 'Registering...' : 'Register App'}
          </Button>

          <Button
            onClick={onBuild}
            variant="contained"
            color="primary"
            disabled={!isValid || configType == 'none' || isRegistering || isBuilding || error}
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
            <a href={`${ECR.docs}/tutorials/compute-at-edge`} target="_blank" rel="noreferrer" >
              Computing at the Edge
              <LaunchIcon className="external-link"/>
            </a>
          </li>
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

            <h4>Example Apps:</h4>
            <ul className="no-padding list-none">
              <li><a onClick={() => onExample(EXAMPLE_REPO_1)}>Helloworld ML</a> [branch: master]</li>
              <li><a onClick={() => onExample(EXAMPLE_REPO_2)}>BirdNet</a> [branch: main]</li>
            </ul>
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
    margin-top: 2em;
    button, svg {
      margin-left: 10px;
    }
  }
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