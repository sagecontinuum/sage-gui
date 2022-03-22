import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import ScienceIcon from '@mui/icons-material/ScienceRounded'
import TagIcon from '@mui/icons-material/LocalOfferRounded'
import Divider from '@mui/material/Divider'

import ErrorMsg from '../../ErrorMsg'
import RepoActions from '../RepoActions'

import {Tabs, Tab} from '/components/tabs/Tabs'
import {useProgress} from '/components/progress/ProgressProvider'
import TagList from './TagList'
import BeeIcon from 'url:/assets/bee.svg'
import { Thumb } from '../formatters'

import * as ECR from '/components/apis/ecr'
import * as Auth from '/components/auth/auth'


import marked from 'marked/lib/marked'
import AppMeta from './AppMeta'



export default function App() {
  const path = useParams()['*']

  const { loading, setLoading } = useProgress()
  const [repo, setRepo] = useState<ECR.Repo>(null)
  const [isPublic, setIsPublic] = useState(null)
  const [sciHtml, setSciHtml] = useState(null)

  const [error, setError] = useState(null)

  const [tabIndex, setTabIndex] = useState(0)


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
          // if no description, just go to the tagged versions tab
          setTabIndex(1)
        }
      })
      .catch(err => setError(err))
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


        {Auth.isSignedIn() &&
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
        <ErrorMsg>{error || {}}</ErrorMsg>
      }

      <Details className="flex">
        <Main>
          <Tabs
            value={tabIndex}
            onChange={(_, idx) => setTabIndex(idx)}
            aria-label="App details tabs"
          >
            <Tab label={<div className="flex items-center"><ScienceIcon fontSize="small" /> Science Overview</div>} idx={0} />
            <Tab label={<div className="flex items-center"><TagIcon fontSize="small" /> Tagged Versions ({versions.length})</div>} idx={1}/>
          </Tabs>
          <br/>


          {tabIndex == 0 &&
            <Science>
              <div dangerouslySetInnerHTML={{__html: sciHtml}} />
            </Science>
          }

          {tabIndex == 0 && sciHtml == null && !loading &&
            <div className="muted">
              No science description available for this app.
            </div>
          }

          {tabIndex == 1 && versions.length &&
            <TagList versions={versions} />
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



