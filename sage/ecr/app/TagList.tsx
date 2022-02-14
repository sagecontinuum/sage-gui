import {useEffect, useState} from 'react'
import styled from 'styled-components'
import { Theme } from '@mui/material/styles';

import makeStyles from '@mui/styles/makeStyles';
import createStyles from '@mui/styles/createStyles';
import withStyles from '@mui/styles/withStyles';

import MuiAccordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'

import Tooltip from '@mui/material/Tooltip'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import MoreIcon from '@mui/icons-material/UnfoldMoreOutlined'
import LessIcon from '@mui/icons-material/UnfoldLessOutlined'
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded'
import BuildIcon from '@mui/icons-material/BuildRounded'
import LaunchIcon from '@mui/icons-material/LaunchRounded'
import GithubIcon from '@mui/icons-material/Github'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Divider from '@mui/material/Divider'

import { useSnackbar } from 'notistack'
import { stringify } from 'yaml'
import yamlIcon from 'url:../../../assets/yaml-logo.svg'
import { formatters, Dot } from '../formatters'

import useWithBuildStatus from '../hooks/useWithBuildStatus'
import BuildIndicator from '../BuildIndicator'
import ConfirmationDialog from '~/components/dialogs/ConfirmationDialog'
import Clipboard from '~/components/utils/Clipboard'

import * as ECR from '~/components/apis/ecr'
import * as Auth from '~/components/auth/auth'
const username = Auth.getUser()

import config from '../../../config'
const docker = config.dockerRegistry


const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      marginBottom: -1,
      boxShadow: 'none'
    },
    heading: {
      fontWeight: 'bold',
      fontSize: theme.typography.pxToRem(15),
      flexBasis: '33.33%',
      flexShrink: 0,
    },
    secondaryHeading: {
      marginRight: 'auto',
      fontSize: theme.typography.pxToRem(14),
      color: theme.palette.text.secondary,
    },
  }),
)


const StyledToggleButtonGroup = withStyles((theme) => ({
  grouped: {
    margin: theme.spacing(0.5),
    border: 'none',
    '&:not(:first-child)': {
      borderRadius: theme.shape.borderRadius,
    },
    '&:first-child': {
      borderRadius: theme.shape.borderRadius,
    },
  },
}))(ToggleButtonGroup)



type Props = {
  versions: ECR.AppDetails[]
}


export default function TagList(props: Props) {
  const { enqueueSnackbar } = useSnackbar()

  const classes = useStyles()

  const [versions, setVersions] = useWithBuildStatus()

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

    setVersions(props.versions)
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
        setVersions(prev => prev)
      }).catch(error => {
        // todo(nc): implement submission (re)build error handling
      }).finally(() => setBuildSubmitted(false))
  }

  // after confirmation handle
  const handleDelete = () => {
    return ECR.deleteApp(deleteTag)
      .then(() =>
        enqueueSnackbar('Tag deleted!', {variant: 'success'})
      ).catch(() =>
        enqueueSnackbar('Failed to delete tag', {variant: 'error'})
      )
  }


  return (
    <Root>
      {versions && versions.map((ver, i) => {
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
              expandIcon={<ExpandMoreIcon className="caret"/>}
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
                  {namespace == username &&
                    <div className="flex gap">
                      <Tooltip title="Rebuild this tagged version">
                        <Button
                          onClick={(evt) => onClickBuild(evt, ver)}
                          size="small" startIcon={<BuildIcon/>}
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
                          startIcon={<DeleteIcon />}
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
                    title={<>GitHub <LaunchIcon style={{fontSize: '1.1em'}}/></>}
                  >
                    <IconButton href={ver.source.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      size="small"
                    >
                      <GithubIcon fontSize="small"/>
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            </AccordionSummary>

            <AccordionDetails className="flex column">
              <p className="no-margin">{description}</p><br/>

              <div className="flex items-end justify-between">
                <StyledToggleButtonGroup
                  size="small"
                  value={format}
                  exclusive
                  onChange={(evt, val) => setFormat(val)}
                  aria-label="display config format"
                >
                  <ToggleButton value="yaml" aria-label="yaml">
                    <img src={yamlIcon} height="18" />
                  </ToggleButton>
                  <ToggleButton value="json" aria-label="json">
                    <span className="text-color">{'{'}</span>
                        json
                    <span className="text-color">{'}'}</span>
                  </ToggleButton>
                </StyledToggleButtonGroup>

                <div>
                  <Tooltip title={showFullConfig ? 'Show only app config' : 'Show all details'}>
                    <IconButton onClick={() => setShowFullConfig(!showFullConfig)} size="small">
                      {showFullConfig ? <LessIcon /> : <MoreIcon />}
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
                    !showFullConfig ?
                      (format == 'yaml' ?
                        stringify(cfgMap[version]) :
                        JSON.stringify(cfgMap[version], null, 4)
                      ) :
                      (format == 'yaml' ?
                        stringify(versions.filter(ver => ver.version == version)[0]):
                        JSON.stringify(versions.filter(ver => ver.version == version)[0], null, 4)
                      )
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
          title={<>Are you sure you want to delete tag <b>{deleteTag.version}</b>?</>}
          content={<>This action cannot be undone!</>}
          confirmBtnText="Delete"
          confirmBtnStyle={{background: '#c70000'}}
          onConfirm={handleDelete}
          onClose={() => setDeleteTag(null)} />
      }
    </Root>
  )
}


const Root = styled.div`


`

const Accordion = styled(MuiAccordion) `
  position: relative;
  border: 1px solid #ddd;
  border-radius: 0 2px 2px 0 ;
  border-left: 2px solid #ddd;

  :hover:not(.Mui-expanded) {
    border-left: 2px solid rgb(28, 140, 201);
    .caret {
      color: rgb(28, 140, 201);
    }
  }


  .MuiAccordionSummary-content {
    display: block;
    margin: 10px 0;
  }

  .tag-actions {
    visibility: hidden;
  }

  :hover .tag-actions {
    visibility: visible;
  }
`