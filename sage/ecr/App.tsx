import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import styled from 'styled-components'

import LaunchIcon from '@material-ui/icons/LaunchRounded'
import EditIcon from '@material-ui/icons/Edit'
import Button from '@material-ui/core/Button'

import ErrorMsg from '../ErrorMsg'
import RepoActions from './RepoActions'

import {Tabs, Tab} from '../../components/tabs/Tabs'
import {useProgress} from '../../components/progress/ProgressProvider'
import Versions from './TagList'
import BeeIcon from 'url:../../assets/bee.svg'
import {Thumb, getThumbnailSrc} from './SpaciousAppList'

import * as ECR from '../apis/ecr'
import * as Auth from '../../components/auth/auth'


import marked from 'marked/lib/marked'


export default function App() {
  const { path } = useParams()

  const { loading, setLoading } = useProgress()
  const [repo, setRepo] = useState<ECR.AppConfig>(null)
  const [versions, setVersions] = useState(null)
  const [isPublic, setIsPublic] = useState(null)

  const [editSci, setEditSci] = useState(false)
  const [sciHtml, setSciHtml] = useState(null)

  const [error, setError] = useState(null)

  const [tabIndex, setTabIndex] = useState(0)

  // state for editing science description
  const [editTabIndex, setEditTabIndex] = useState(0)
  const [markdownText, setMarkDownText] = useState('')
  const [previewHtml, setPreviewHtml] = useState()


  useEffect(() => {

    const [namespace, name ] = path.split('/')

    setLoading(true)
    Promise.all([
      ECR.getRepo({namespace, name}),
      // may need other requests?
    ]).then(([repo]) => {
      setRepo(repo)
      setVersions(repo.versions)
      console.log('repo ', repo)

      if (repo.science_description) {
        fetch(`${ECR.url}/${repo.science_description}`)
          .then(res => res.text())
          .then(text => {
            setMarkDownText(text)
            setSciHtml(marked(text))
          })
      }

    }).catch(err => setError(err))
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
          {/* eventually, we'll pull the thumbnail from the database
            repo && repo.images?.length > 0 ?
            <Thumb src={`${ECR.url}${repo.images[0]}`} /> :
            <></>
          */}
          {repo &&
            <Thumb
              src={getThumbnailSrc(repo.versions[0].source.url, repo.versions[0].source.branch)}
              onError={function (e) {e.target.onerror = null; e.target.classList.add('placeholder'); e.target.src = BeeIcon}}
            />
          }

          <div className="flex column">
            <div style={{fontSize: '2em', fontWeight: 'bold'}}>
              {repo.namespace} / {repo.name}
            </div>

            <p>{repo.versions[0]?.description}</p>

            <div>
              <b>Repo:</b> <a href={repo.versions[0]?.source.url} target="_blank" rel="noreferrer">
                {repo.versions[0]?.source.url} <LaunchIcon className="external-link"/>
              </a>
            </div>

          </div>

        </div>

        {Auth.isSignedIn() &&
          <div className="actions">
            <RepoActions
              namespace={repo.namespace}
              name={repo.name}
              version={repo.version}
              condensed={false}
              onComplete={handleActionComplete}
              versionCount={versions.length}
              isPublic={isPublic}
            />
          </div>
        }
      </div>

      {error &&
        <ErrorMsg>{error}</ErrorMsg>
      }

      <Main>
        <Tabs
          value={tabIndex}
          onChange={(_, idx) => setTabIndex(idx)}
          aria-label="App details tabs"
        >
          {/*repo.science_description && <Tab label="Science Overview" idx={0} />*/}
          <Tab label="Tagged Versions" idx={0} />
        </Tabs>
        <br/>


        {tabIndex == 1 &&
          <Content>
            {!editSci &&
              <ScienceDescript dangerouslySetInnerHTML={{__html: sciHtml}} />
            }

            {!editSci &&
              <EditBtn onClick={() => setEditSci(true)} className="flex items-center">
                <EditIcon fontSize="small"/> Edit
              </EditBtn>
            }

            {editSci &&
              <SaveContainer className="flex gap">
                <Button>Cancel</Button>
                <Button color="primary" variant="contained">Save</Button>
              </SaveContainer>
            }

            {editSci &&
              <div>
                <Tabs
                  value={tabIndex}
                  onChange={(_, idx) => setEditTabIndex(idx)}
                  aria-label="edit markdown tabs"
                >
                  <Tab label="Edit" idx={0} />
                  <Tab label="Preview" idx={1} />
                </Tabs>


                {editTabIndex == 0 &&
                  <Editor
                    value={markdownText}
                    onChange={(evt) => setMarkDownText(evt.target.value)}
                  />
                }

                {editTabIndex == 1 &&
                  <ScienceDescript dangerouslySetInnerHTML={{__html: sciHtml}} />
                }

              </div>
            }
          </Content>
        }

        {tabIndex == 0 &&
          <>
            {versions &&
              <Versions
                versions={versions} />
            }
          </>
        }
      </Main>
    </Root>
  )
}


const Root = styled.div`
  padding: 20px 0px;
`



const Main = styled.div`
  margin-top: 2em;
`

const EditBtn = styled.a`
  position:absolute;
  right: 50px;
  top: 10px;
`

const Editor = styled.textarea`
  margin-top: 10px;
  height: 500px;
  width: 100%;
`

const Content = styled.div`
  position: relative;
`

const ScienceDescript = styled.div`

`



const SaveContainer = styled.div`
  position:absolute;
  right: 50px;
  top: 0px;

`

