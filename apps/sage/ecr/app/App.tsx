import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'

import ScienceIcon from '@mui/icons-material/ScienceRounded'
import InputIcon from '@mui/icons-material/InputRounded'
import TagIcon from '@mui/icons-material/LocalOfferRounded'
import ChartIcon from '@mui/icons-material/TimelineRounded'
import Divider from '@mui/material/Divider'
import BeeIcon from 'url:/assets/bee.svg'

import ErrorMsg from '../../ErrorMsg'
import RepoActions from '../RepoActions'

import { Tabs, Tab } from '/components/tabs/Tabs'
import { useProgress } from '/components/progress/ProgressProvider'
import TagList from './TagList'
import InputsList from './InputList'
import { Thumb } from '../formatters'

import * as ECR from '/components/apis/ecr'
import Auth from '/components/auth/auth'

import AppMeta from './AppMeta'
import AppData from './AppData'

import { marked } from 'marked'

type Tab = 'science' | 'inputs' | 'tags' | 'data'

export default function App() {
  const path = useParams()['*']
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'science'

  const { loading, setLoading } = useProgress()
  const [repo, setRepo] = useState<ECR.Repo>(null)
  const [isPublic, setIsPublic] = useState(null)
  const [sciHtml, setSciHtml] = useState(null)

  const [error, setError] = useState(null)

  useEffect(() => {
    const [namespace, name] = path.split('/')

    setLoading(true)
    ECR.getRepo({namespace, name})
      .then((repo) => {
        setRepo(repo)

        const latestTag = repo.versions[0]
        const hasSciMarkDown = !!latestTag?.science_description
        const mdPath = hasSciMarkDown ?
          latestTag?.science_description : null

        if (mdPath) {
          return ECR.getSciMarkdown(mdPath)
            .then(text => setSciHtml(marked(text)))
        } else {
          // if no description, just go to tags
          params.set('tab', 'tags')
          setParams(params)
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))

  }, [path, setLoading])



  const handleActionComplete = () => {
    // todo: implement
  }

  const versions = repo ? repo.versions : []
  const latestTag = versions.length ? versions[0] : null
  const [namespace, name] = path.split('/')

  return (
    <Root>
      <div className="flex justify-between">
        <div className="flex">
          {repo && latestTag.thumbnail ?
            <Thumb src={`${ECR.url}/meta-files/${latestTag.thumbnail}`} /> :
            <Thumb className="placeholder" src={BeeIcon} />
          }

          <div className="flex column">
            <h1 className="no-margin">{namespace} / {name}</h1>
            <p>{latestTag?.description}</p>
          </div>
        </div>


        {Auth.isSignedIn &&
          <div className="actions">
            <RepoActions
              namespace={namespace}
              name={name}
              condensed={false}
              onComplete={handleActionComplete}
              versionCount={versions.length}
              isPublic={isPublic}
            />
          </div>
        }
      </div>

      <HR />

      {error &&
        <ErrorMsg>{error}</ErrorMsg>
      }

      <Details className="flex">
        <Main>
          <Tabs
            value={tab}
            aria-label="App details tabs"
          >
            <Tab
              label={
                <div className="flex items-center">
                  <ScienceIcon fontSize="small" />&nbsp;Science Overview
                </div>
              }
              value="science"
              component={Link}
              to="?tab=science"
              replace
            />
            <Tab
              label={
                <div className="flex items-center">
                  <InputIcon fontSize="small" />&nbsp;Input Arguments
                </div>
              }
              value="inputs"
              component={Link}
              to="?tab=inputs"
              replace
            />
            <Tab
              label={
                <div className="flex items-center">
                  <TagIcon fontSize="small" />&nbsp;Tagged Versions ({versions.length})
                </div>
              }
              value="tags"
              component={Link}
              to="?tab=tags"
              replace
            />
            <Tab label={
              <div className="flex items-center">
                <ChartIcon fontSize="small" />&nbsp;Data
              </div>
            }
            value="data"
            component={Link}
            to="?tab=data"
            replace
            />
          </Tabs>
          <br/>


          {tab == 'science' &&
            <Science>
              <div dangerouslySetInnerHTML={{__html: sciHtml}} />
            </Science>
          }

          {tab == 'science' && sciHtml == null && !loading &&
            <div className="muted">
              No science description available for this app.
            </div>
          }

          {tab == 'inputs' && versions.length &&
            <InputsList versions={versions} />
          }

          {tab == 'tags' && versions.length &&
            <TagList versions={versions} />
          }

          {tab == 'data' &&
            <AppData plugin={path} />
          }
        </Main>

        {latestTag &&
          <AppMeta data={latestTag} />
        }
      </Details>
    </Root>
  )
}



const Root = styled.div`
  padding: 20px 0px;

  // todo(nc): remove thumb component
  .thumb {
    width: 125px;
    height: 125px;
    object-fit: contain;
    border: 1px solid #ccc;
    border-radius: 5px;
    margin-right: 1em;

    &.placeholder {
      padding: 1em;
      filter: drop-shadow(0px 0px 0.3rem #ccc);
    }
  }
`

const HR = styled(Divider)`
  margin: 2em 0 0 0;
`

const Details = styled.div`
`


const Main = styled.div`
  width: 100%;
`

const Science = styled.div`
  position: relative;
  width: 100%;
`



