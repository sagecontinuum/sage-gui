import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import Accordion, { useAccordionStyles } from '/components/layout/Accordion'

import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import { useTheme } from '@mui/material/styles'
import {
  ExpandMore, UnfoldMoreOutlined, UnfoldLessOutlined, DeleteOutlineRounded,
  BuildRounded, LaunchRounded, GitHub, LibraryAddCheckOutlined
} from '@mui/icons-material'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Divider from '@mui/material/Divider'

import { useSnackbar } from 'notistack'
import { stringify } from 'yaml'
import YAMLIcon from '/assets/yaml-logo.svg'
import { formatters } from '../formatters'

import useWithBuildStatus from '../hooks/useWithBuildStatus'
import BuildIndicator from '../BuildIndicator'
import ConfirmationDialog from '/components/dialogs/ConfirmationDialog'
import Clipboard from '/components/utils/Clipboard'
import { Highlight, themes } from 'prism-react-renderer'

import * as ECR from '/components/apis/ecr'
import Auth from '/components/auth/auth'

import config from '/config'
const docker = config.dockerRegistry



type Props = {
  versions: ECR.AppDetails[]
}


export default function TagList(props: Props) {
  const { enqueueSnackbar } = useSnackbar()
  const theme = useTheme()

  const classes = useAccordionStyles()

  const [versions, setVersions] = useWithBuildStatus<ECR.AppDetails[]>()

  const [cfgMap, setCfgMap] = useState({})
  const [format, setFormat] = useState<'yaml' | 'json'>('yaml')
  const [showFullConfig, setShowFullConfig] = useState(false)

  const [loadingConfigs, setLoadingConfigs] = useState(false)

  const [buildSubmitted, setBuildSubmitted] = useState(false)
  const [deleteTag, setDeleteTag] = useState<ECR.AppDetails>(null)
  const [expanded, setExpanded] = useState<string | false>('panel-0')

  // fetch all submitted app configs
  useEffect(() => {
    setLoadingConfigs(true)

    const proms = props.versions.map(({namespace, name, version}) =>
      ECR.getAppConfig({namespace, name, version})
    )

    Promise.all(proms)
      .then(configs => {
        const cMap = configs.reduce((acc, cfg) =>
          cfg.version in acc ? acc : {...acc, [cfg.version]: cfg}
        , {})
        setCfgMap(cMap)
      })
      .finally(() => setLoadingConfigs(false))

    if (typeof setVersions === 'function') {
      setVersions(props.versions)
    }
  }, [props.versions, setVersions])



  const handleChange = (panel: string) => (_, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const onClickDeleteTag = (evt, app) => {
    evt.stopPropagation()
    setDeleteTag(app)
  }

  const onClickBuild = (evt, app) => {
    evt.stopPropagation()
    enqueueSnackbar('Build submitted')
    setBuildSubmitted(true)
    ECR.build(app)
      .then(() => {
        enqueueSnackbar('Build started')
        if (typeof setVersions === 'function') {
          setVersions(prev => prev)
        }
      }).catch(error => {
        enqueueSnackbar(`${error.message}  Please contact us for help.`, {variant: 'error'})
      }).finally(() => setBuildSubmitted(false))
  }

  // after confirmation handle
  const handleDelete = () => {
    return ECR.deleteApp({
      namespace: deleteTag.namespace || '',
      name: deleteTag.name,
      version: deleteTag.version
    })
      .then(() =>
        enqueueSnackbar('Tag deleted!', {variant: 'success'})
      ).catch(() =>
        enqueueSnackbar('Failed to delete tag', {variant: 'error'})
      )
  }


  return (
    <>
      {versions && (versions as ECR.AppDetails[]).map((ver, i) => {
        const {
          namespace,
          name,
          version,
          description,
          time_last_updated,
          buildUrl,
          isBuilding,
          buildResult
        } = ver

        const panel = `panel-${i}`

        return (
          <Accordion
            className={classes.root}
            expanded={expanded === panel}
            onChange={handleChange(panel)}
            key={ver.id}
          >

            <AccordionSummary
              expandIcon={<ExpandMore className="caret"/>}
              aria-controls={`${panel}-content`}
              id={`${panel}-content`}
            >
              <div className="flex items-center justify-between">
                <div className="flex gap">
                  <b>{version}</b>
                  <span className={classes.secondaryHeading}>
                    updated {formatters.time(time_last_updated)}
                  </span>
                  <BuildIndicator buildUrl={buildUrl} isBuilding={isBuilding} buildResult={buildResult} />
                </div>

                <div className="tag-actions flex" >
                  {/* todo(nc): allow actions on write or appropriate access */}
                  {namespace == Auth.user &&
                    <div className="flex gap">
                      <Tooltip title="Submit a new version of this app">
                        <Button
                          size="small" startIcon={<LibraryAddCheckOutlined />}
                          variant="contained"
                          color="primary"
                          disabled={isBuilding || buildSubmitted}
                          component={Link}
                          to={
                            `/apps/create-app?url=${ver.source.url}&branch=${
                              ver.source.branch || (ver.source as {tag?: string}).tag
                            }`
                          }
                        >
                          {buildSubmitted ? 'Submitting...' : 'New'}
                        </Button>
                      </Tooltip>
                      <Tooltip title="Rebuild this tagged version">
                        <Button
                          onClick={(evt) => onClickBuild(evt, ver)}
                          size="small" startIcon={<BuildRounded/>}
                          variant="contained"
                          color="primary"
                          disabled={isBuilding || buildSubmitted}
                        >
                          {buildSubmitted ? 'Submitting...' : 'Rebuild'}
                        </Button>
                      </Tooltip>
                      <Tooltip title="Delete tag">
                        <Button
                          onClick={(evt) => onClickDeleteTag(evt, ver)}
                          size="small"
                          className="delete"
                          startIcon={<DeleteOutlineRounded />}
                          variant="outlined"
                          style={{color: 'rgb(145, 35, 65)', border: '1px solid rgb(145, 35, 65)'}}
                        >
                          Delete
                        </Button>
                      </Tooltip>
                      <Divider orientation="vertical" style={{margin: '0 10px 0 0'}}/>
                    </div>
                  }

                  <Tooltip
                    title={<>GitHub <LaunchRounded style={{fontSize: '1.1em'}}/></>}
                  >
                    <IconButton
                      component="a"
                      href={ver.source.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      size="small"
                    >
                      <GitHub fontSize="small"/>
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            </AccordionSummary>

            <AccordionDetails className="flex column">
              <p className="no-margin">{description}</p><br/>

              <div className="flex items-end justify-between">
                <ToggleButtonGroup
                  size="small"
                  value={format}
                  exclusive
                  onChange={(evt, val) => setFormat(val)}
                  aria-label="display config format"
                >
                  <ToggleButton value="yaml" aria-label="yaml">
                    <YAMLIcon {...{height: 18, width: 18} as React.SVGProps<SVGSVGElement>} />
                  </ToggleButton>
                  <ToggleButton value="json" aria-label="json">
                    <span className="text-color">{'{'}</span>
                        json
                    <span className="text-color">{'}'}</span>
                  </ToggleButton>
                </ToggleButtonGroup>

                <div>
                  <Tooltip title={showFullConfig ? 'Show only app config' : 'Show all details'}>
                    <IconButton onClick={() => setShowFullConfig(!showFullConfig)} size="small">
                      {showFullConfig ? <UnfoldLessOutlined /> : <UnfoldMoreOutlined />}
                    </IconButton>
                  </Tooltip>
                </div>
              </div>

              {loadingConfigs &&
                  <pre className="code">loading...</pre>
              }
              {version in cfgMap &&
                <Clipboard
                  content={
                    <Highlight
                      theme={theme.palette.mode === 'dark' ? themes.vsDark : themes.github}
                      language={format === 'yaml' ? 'yaml' : 'json'}
                      code={
                        !showFullConfig ?
                          (format == 'yaml' ?
                            stringify(cfgMap[version]) :
                            JSON.stringify(cfgMap[version], null, 4)
                          ) :
                          (format == 'yaml' ?
                            stringify(
                              (versions as ECR.AppDetails[] || []).filter(ver => ver.version == version)[0]
                            ):
                            JSON.stringify(
                              (versions as ECR.AppDetails[] || []).filter(ver => ver.version == version)[0],
                              null,
                              4
                            )
                          )
                      }
                    >
                      {({ className, style, tokens, getLineProps, getTokenProps }) => (
                        <pre
                          className={className}
                          style={{
                            ...style,
                            background: theme.palette.mode === 'dark'
                              ? theme.palette.background.paper
                              : theme.palette.background.default,
                            margin: 0,
                          }}
                        >
                          {tokens.map((line, i) => (
                            <div key={i} {...getLineProps({ line, key: i })}>
                              {line.map((token, key) => (
                                <span key={key} {...getTokenProps({ token, key })} />
                              ))}
                            </div>
                          ))}
                        </pre>
                      )}
                    </Highlight>
                  }
                />
              }
              <br/>

              <h5 className="muted no-margin">Pull this image</h5>
              <Clipboard
                content={<>docker pull {docker}/{namespace}/{name}:{version}</>}
                tooltip="Copy CMD"
              />
            </AccordionDetails>
          </Accordion>
        )
      })
      }

      {deleteTag &&
        <ConfirmationDialog
          title={`Are you sure you want to delete tag ${deleteTag.version}?`}
          content={<>This action cannot be undone!</>}
          confirmBtnText="Delete"
          confirmBtnStyle={{background: '#c70000'}}
          onConfirm={handleDelete}
          onClose={() => setDeleteTag(null)} />
      }
    </>
  )
}

