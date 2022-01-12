import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import styled from 'styled-components'

import ScienceIcon from '@mui/icons-material/ScienceRounded'
import TagIcon from '@mui/icons-material/LocalOfferRounded'
import Divider from '@mui/material/Divider'

import ErrorMsg from '../../ErrorMsg'
import RepoActions from '../RepoActions'

import {Tabs, Tab} from '../../../components/tabs/Tabs'
import {useProgress} from '../../../components/progress/ProgressProvider'
import TagList from './TagList'
import BeeIcon from 'url:../../../assets/bee.svg'
import { Thumb } from '../formatters'

import * as ECR from '../../apis/ecr'
import * as Auth from '../../../components/auth/auth'


import marked from 'marked/lib/marked'
import AppMeta from './AppMeta'



export default function App() {
  const { path } = useParams()

  const { loading, setLoading } = useProgress()
  const [repo, setRepo] = useState<ECR.Repo>(null)
  const [latestTag, setLatestTag] = useState(null)
  const [isPublic, setIsPublic] = useState(null)
  const [sciHtml, setSciHtml] = useState(null)

  const [error, setError] = useState(null)

  const [tabIndex, setTabIndex] = useState(0)


  useEffect(() => {

    const [namespace, name ] = path.split('/')

    setLoading(true)
    ECR.getRepo({namespace, name})
      .then((repo) => {
        setRepo(repo)

        const latestTag = repo.versions[0]
        setLatestTag(latestTag)

        const hasSciMarkDown = !!latestTag?.science_description
        const mdPath = hasSciMarkDown ?
          latestTag?.science_description : null

        if (mdPath) {
          fetch(`${ECR.url}/meta-files/${mdPath}`)
            .then(res => res.text())
            .then(text => setSciHtml(marked(text)))
        } else {
          // if no description, we'll only have the tagged versions tab
          setTabIndex(1)
        }
      })
      .catch(err => setError(err))
      .finally(() => setLoading(false))

  }, [path, setLoading])



  const handleActionComplete = () => {
    // todo: implement
  }

  if (loading || !repo) return <></>

  return (
    <Root>
      <div className="flex justify-between">
        <div className="flex">
          {repo && latestTag.thumbnail ?
            <Thumb src={`${ECR.url}/meta-files/${latestTag.thumbnail}`} /> :
            <Thumb className="placeholder" src={BeeIcon} />
          }

          <div className="flex column">
            <div style={{fontSize: '2em', fontWeight: 'bold'}}>
              {repo.namespace} / {repo.name}
            </div>

            <p>{latestTag?.description}</p>
          </div>
        </div>


        {Auth.isSignedIn() &&
          <div className="actions">
            <RepoActions
              namespace={repo.namespace}
              name={repo.name}
              condensed={false}
              onComplete={handleActionComplete}
              versionCount={repo.versions.length}
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
            <Tab label={<div className="flex items-center"><TagIcon fontSize="small" /> Tagged Versions ({repo.versions.length})</div>} idx={1}/>
          </Tabs>
          <br/>


          {tabIndex == 0 &&
            <Science>
              <div dangerouslySetInnerHTML={{__html: sciHtml}} />
            </Science>
          }

          {tabIndex == 0 && !sciHtml &&
            <div className="muted">
              No science description available for this app.
            </div>
          }

          {tabIndex == 1 && repo.versions &&
            <TagList versions={repo.versions} />
          }
        </Main>

        <AppMeta data={latestTag} />

      </Details>
    </Root>
  )
}



const Root = styled.div`
  padding: 20px 0px;
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



