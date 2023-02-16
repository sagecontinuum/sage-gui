import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Tooltip from '@mui/material/Tooltip'
import FormHelperText from '@mui/material/FormHelperText'
import FormControlLabel from '@mui/material/FormControlLabel'
import CheckIcon from '@mui/icons-material/Check'
import LaunchIcon from '@mui/icons-material/LaunchRounded'
import HelpIcon from '@mui/icons-material/HelpOutlineRounded'
import TagIcon from '@mui/icons-material/LocalOfferOutlined'
import CaretIcon from '@mui/icons-material/ExpandMoreRounded'


import * as YAML from 'yaml'
import { useSnackbar } from 'notistack'

import { StepTitle, Step, StepForm } from '/components/layout/FormLayout'
import ConfigForm from './ConfigForm'
import FilterMenu from '/components/FilterMenu'
import CheckBox from '/components/input/Checkbox'

import Auth from '/components/auth/auth'
import * as ECR from '/components/apis/ecr'
import * as User from '/components/apis/user'

const user = Auth.user

const devList = [
  'nconrad',
  'gemblerz',
  'seanshahkarami',
  'jswantek'
]

export const isDevUser = devList.includes(user)


const GITHUB_API = 'https://api.github.com'
const GITHUB_STATIC_URL = 'https://raw.githubusercontent.com'
const SAGE_YAML_DOCS_URL =
  `https://github.com/waggle-sensor/pywaggle/blob/main/docs/writing-a-plugin.md` +
  `#adding-hello-world-plugin-packaging-info`

const EXAMPLES = {
  'hello': 'https://github.com/waggle-sensor/plugin-helloworld-ml',
  'motion': 'https://github.com/waggle-sensor/plugin-motion-analysis',
  'birdnet': 'https://github.com/dariodematties/BirdNET_Plugin'
}



const getRepoPath = (url: string) =>
  url.replace('https://github.com/', '').replace('.git', '')



const initialState = {
  namespace: user,
  // name: '',     // populated automatically
  // version: '',  // populated automatically
  description: '',
  source: {
    architectures: [],
    directory: '',
    dockerfile: '',
    url: '',
    branch: '',
  },
  url: '',
  directory: '',
  resources: [],
  inputs: [],
  metadata: {}
}



export default function CreateApp() {
  const navigate = useNavigate()
  const { enqueueSnackbar } = useSnackbar()

  // app repo
  const [repoURL, setRepoURL] = useState('')
  const [branch, setBranch] = useState('main')
  const [branchList, setBranchList] = useState<{id: string, label: string}[]>([])

  // app config state
  const [form, setForm] = useState<ECR.AppMeta>(initialState)
  const [config, setConfig] = useState<string>(YAML.stringify(initialState))
  const [configType, setConfigType] = useState<'yaml'|'json'|'none'|string>(null)

  const [validating, setValidating] = useState(false)
  const [isValid, setIsValid] = useState(null)

  const [isApproved, setIsApproved] = useState<boolean>()
  const [isRegistering, setIsRegistering] = useState(false)
  const [isBuilding, setIsBuilding] = useState(false)
  const [error, setError] = useState(null)

  // debug settings
  const [devMode, setDevMode] = useState(false)

  // disable submit button, if needed
  useEffect(() => {
    User.getUserDetails()
      .then(user => setIsApproved(user.is_approved))
      .catch(error => {
        setError(error.message)
        setIsApproved(false)
      })
  }, [])

  const fetchSageConfig = useCallback((branch) => {
    if (!repoURL || !branch) return

    const path = getRepoPath(repoURL)

    fetch(`${GITHUB_STATIC_URL}/${path}/${branch}/sage.yaml`)
      .then(res => {
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
  }, [repoURL])


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

        fetchSageConfig(branch)
      })
      .catch(() => setIsValid(false))
      .then(() => setValidating(false))
  }


  const onRepoBranchChange = (tagObj) => {
    if (!tagObj) {
      return
    }

    setBranch(tagObj.id)
    setIsValid(true)
    fetchSageConfig(tagObj.id)
  }


  const sanitizeForm = (obj) => {
    return {...obj, namespace: user}
  }


  const onRegister = () => {
    setIsRegistering(true)
    ECR.register(config)
      .then(() => {
        enqueueSnackbar('App registered', {variant: 'success'})
        navigate('/apps/my-apps')
      }).catch(error => {
        if (error.message.includes('force=true')) {
          // todo: implement overwrite
        }
        setError(error.message)
      }).finally(() => setIsRegistering(false))
  }


  const onBuild = () => {
    setIsBuilding(true)
    ECR.registerAndBuild(config)
      .then(() => {
        enqueueSnackbar('Build started')
        navigate('/apps/my-apps')
      }).catch(error => {
        setError(error.message)
      }).finally(() => setIsBuilding(false))
  }


  const onUpdateForm = (event) => {
    const {name, value} = event.target

    const f = {...form, [name]: value}

    setForm(f)
    setConfig(YAML.stringify(f))
  }


  const disableRegister = () =>
    !form.namespace || !form.name || !isValid ||
    configType == 'none' || isRegistering || isBuilding || error


  const disableBuild = () =>
    !isApproved || disableRegister()


  return (
    <Root>
      <Main>
        <h1>Create App</h1>

        <StepTitle icon="1" label="Repo URL"/>
        <StepForm className="repo-step flex items-center gap" onSubmit={onRepoVerify}>
          <TextField
            label="GitHub Repo URL"
            placeholder="https://github.com/me/my-edge-app"
            value={repoURL}
            onChange={evt => setRepoURL(evt.target.value)}
            error={isValid == false}
            helperText={isValid == false ? 'Sorry, we could not verify github repo url' : ''}
            style={{width: 500}}
            InputLabelProps={{ shrink: true }}
            required
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
        </StepForm>


        <StepTitle icon="2" label="App Name and Version" />
        <Step>
          <ConfigForm
            form={form}
            onChange={onUpdateForm}
          />
        </Step>


        {isValid &&
          <Step>
            <h4>App Config</h4>
            {configType == 'none' &&
              <p>
                No <span className="mono-term">sage.yaml</span> configuration file found.
                Before registering or building your app, please create a sage.yaml
                following the directions <a href={SAGE_YAML_DOCS_URL} target="_blank" rel="noreferrer"><b>here</b></a>.
              </p>
            }

            {configType != 'none' &&
              <pre className="code">{config}</pre>
            }

            {error &&
              <FormHelperText style={{fontSize: '1.1em'}} error>{error}</FormHelperText>
            }
          </Step>
        }


        <Step>
          <Button
            onClick={onRegister}
            variant="outlined"
            color="primary"
            disabled={disableRegister()}
            className="register-app"
          >
            {isRegistering ? 'Registering...' : 'Register App'}
          </Button>
          <Button
            onClick={onBuild}
            variant="contained"
            color="primary"
            disabled={disableBuild()}
          >
            {isBuilding ? 'Submitting...' : 'Register & Build App'}
          </Button>

          {isApproved === false &&
            <p>
              <br/>
              <b>Note:</b> You may register an application, but to enable builds of apps on
              our infrastructure, please <a href={`${ECR.docs}/contact-us`} target="_blank" rel="noreferrer" >
                contact us
                <LaunchIcon className="external-link"/>
              </a>.
            </p>
          }
        </Step>
      </Main>


      <Help>
        <h3>Help</h3>
        <hr/>
        <ul className="no-padding list-none">
          <li>
            <a href={`${ECR.docs}/tutorials/edge-apps/intro-to-edge-apps`} target="_blank" rel="noreferrer" >
              Intro to edge apps
              <LaunchIcon className="external-link"/>
            </a>
          </li>
          <li>
            <a href={`${ECR.docs}/tutorials/edge-apps/creating-an-edge-app`} target="_blank" rel="noreferrer" >
              Creating an edge app
              <LaunchIcon className="external-link"/>
            </a>
          </li>
        </ul>

        {isDevUser &&
          <DebugOptions>
            <h3 className="no-margin">
              Debugging
              <sup>
                <Tooltip title={
                  `These special debug mode options are only available to: ${devList.join(', ')}`
                } placement="top">
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
              <li><a onClick={() => setRepoURL(EXAMPLES.hello)}>Helloworld ML</a> [master branch]</li>
              <li><a onClick={() => setRepoURL(EXAMPLES.motion)}>Motion Analysis</a> [multiple branches]</li>
              <li><a onClick={() => setRepoURL(EXAMPLES.birdnet)}>BirdNet</a> [main branch]</li>
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
  margin: 10px 0;
  flex-grow: 3;

  .repo-step {
    margin-top: 6px;
    button, svg {
      margin-left: 10px;
    }
  }

  .register-app {
    margin-right: 10px;
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