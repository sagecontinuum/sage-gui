import React, {useEffect, useState} from 'react'
import styled from 'styled-components'
import { makeStyles, Theme, createStyles, withStyles } from '@material-ui/core/styles'

import MuiAccordion from '@material-ui/core/Accordion'
import AccordionDetails from '@material-ui/core/AccordionDetails'
import AccordionSummary from '@material-ui/core/AccordionSummary'

import Tooltip from '@material-ui/core/Tooltip'
import IconButton from '@material-ui/core/IconButton'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import MoreIcon from '@material-ui/icons/UnfoldMoreOutlined'
import LessIcon from '@material-ui/icons/UnfoldLessOutlined'
import CopyIcon from '@material-ui/icons/FileCopyOutlined'
import DoneIcon from '@material-ui/icons/DoneOutlined'
import DeleteIcon from '@material-ui/icons/DeleteOutlineRounded'
import LaunchIcon from '@material-ui/icons/LaunchRounded'
import GithubIcon from '@material-ui/icons/Github'
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup'
import ToggleButton from '@material-ui/lab/ToggleButton'


import { useSnackbar } from 'notistack'

import jsyaml from '../../node_modules/js-yaml/dist/js-yaml'

import yamlIcon from 'url:../../assets/yaml-logo.svg'
import { formatters } from './formatters'

import * as ECR from '../apis/ecr'
import ConfirmationDialog from '../../components/dialogs/ConfirmationDialog'




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


export default function Versions(props: Props) {
  const { enqueueSnackbar } = useSnackbar()
  const {versions} = props

  const classes = useStyles()

  const [cfgMap, setCfgMap] = useState({})
  const [format, setFormat] = useState<'yaml' | 'json'>('yaml')
  const [showFullConfig, setShowFullConfig] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const [loadingConfigs, setLoadingConfigs] = useState(false)

  const [deleteTag, setDeleteTag] = useState<ECR.AppDetails>(null)
  const [expanded, setExpanded] = useState<string | false>('panel-0')

  // fetch all submitted app configs
  useEffect(() => {
    setLoadingConfigs(true)

    const proms = versions.map(({namespace, name, version}) =>
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
  }, [versions])


  const handleChange = (panel: string) => (_, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
  }

  const handleCopy = (ver: string) => {
    navigator.clipboard.writeText(jsyaml.dump(cfgMap[ver]))
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }


  const onClickDeleteTag = (evt, app) => {
    evt.stopPropagation()
    setDeleteTag(app)
  }

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
      <h2>Tags</h2>
      {versions.map((ver, i) => {
        const {
          version,
          description,
          time_last_updated
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
                </div>

                <div className="tag-actions">
                  <Tooltip title="Delete tag">
                    <IconButton onClick={(evt) => onClickDeleteTag(evt, ver)} size="small" className="delete">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>

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
                  <Tooltip title={isCopied ? 'Copied!' : 'Copy yaml config'}>
                    <IconButton onClick={() => handleCopy(version)} size="small">
                      {isCopied ? <DoneIcon  />  : <CopyIcon />}
                    </IconButton>
                  </Tooltip>
                </div>
              </div>

              {loadingConfigs &&
                  <pre className="code">loading...</pre>
              }
              {version in cfgMap &&
                  <pre className="code text-xs">
                    {!showFullConfig ?
                      (format == 'yaml' ?
                        jsyaml.dump(cfgMap[version]) :
                        JSON.stringify(cfgMap[version], null, 4)
                      ) :
                      (format == 'yaml' ?
                        jsyaml.dump(versions.filter(ver => ver.version == version)[0]):
                        JSON.stringify(versions.filter(ver => ver.version == version)[0], null, 4)
                      )
                    }
                  </pre>
              }

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