import { useCallback, useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate, useMatch } from 'react-router-dom'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import AddIcon from '@mui/icons-material/AddRounded'
import FeaturedIcon from '@mui/icons-material/StarsRounded'
import SamplersIcon from '@mui/icons-material/CollectionsRounded'
import PublicIcon from '@mui/icons-material/PublicRounded'

import BeeIcon from 'url:/assets/bee.svg'

import ErrorMsg from '../../ErrorMsg'
import Table from '/components/table/Table'
import TableSearch from '/components/table/TableSearch'
import { useProgress } from '/components/progress/ProgressProvider'
import * as ECR from '/components/apis/ecr'

import {Top} from '/components/layout/Layout'
import SpaciousLayout from './SpaciousAppList'
import FeaturedApps from './FeaturedApps'
import { formatters } from '../formatters'
import LayoutToggle from '/components/layout/LayoutToggle'

import useWithBuildStatus from '../hooks/useWithBuildStatus'

import settings from '/apps/sage/settings'
const {featuredApps, samplers} = settings

import { getPluginStats } from '/apps/sage/data/rollupUtils'


const columns = [
  {
    id: 'name',
    label: 'Name',
    format: formatters.name
  }, {
    id: 'namespace',
    label: 'Namespace'
  }, {
    id: 'versions',
    label: 'Tags',
    format: formatters.versions
  }, {
    id: 'owner',
    label: 'Owner'
  }, {
    id: 'repo',
    label: 'Repo',
    format: formatters.repo
  }, {
    id: 'time_last_updated',
    label: 'Last Update',
    format: formatters.time
  }
]


const queryData = (data: object[], query: string) => {
  return data.filter(row =>
    Object.values(row)
      .join('').toLowerCase()
      .includes(query.toLowerCase())
  )
}


export default function AppList() {
  const [params, setParams] = useSearchParams()
  const path = useMatch('*').pathname
  const view = path.split('/')[2]

  const navigate = useNavigate()

  const query = params.get('query') || ''

  const ref = useRef<boolean>()
  const {loading, setLoading} = useProgress()

  const [data, setData] = useWithBuildStatus<ECR.AppDetails[]>()
  const [rows, setRows] = useState<ECR.AppDetails[]>()
  const [error, setError] = useState(null)

  const [pluginData, setPluginData] = useState()

  const [viewStyle, setViewStyle] = useState<'compact' | 'spacious'>('spacious')


  const listApps = useCallback(() => {
    const opts = view == 'explore' ? 'public' : 'mine'
    const p1 = ECR.listApps(opts)
      .then(data => {
        if (!ref.current) return
        setData(data)
        return data
      }).catch(error => setError(error.message))
      .finally(() => {
        if (!ref.current) return
        setLoading(false)
      })

    const p2 = getPluginStats()

    Promise.all([p1, p2])
      .then(([ecr, pluginData]) => {
        const names = Object.keys(pluginData)

        ecr = ecr.map(obj => ({
          ...obj,
          hasRecentData: !!names.find(name => name.includes(`${obj.namespace}/${obj.name}`))
        }))

        setData(ecr)
      })

  }, [setLoading, view])


  useEffect(() => {
    ref.current = true
    setLoading(true)

    if (['shared-with-me'].includes(view)) {
      // todo(nc): implement
      setData([])
      setLoading(false)
      return
    }

    listApps()

    return () => {
      ref.current = false
    }
  }, [view, setLoading, listApps])


  // effect for queries
  useEffect(() => {
    if (!data) return

    setRows(queryData(data, query))
  }, [view, query, data])



  // todo: refactor into useContext or table componnent?
  const onSearch = ({query}) => {
    if (query) params.set('query', query)
    else params.delete('query')
    setParams(params, {replace: true})
  }

  const onActionComplete = () => {
    setLoading(true)
    listApps()
  }


  const onNavigate = (path: string) => {
    navigate(path)
  }

  if (!data && !error) return <></>


  return (
    <Root>
      <Top top="0">
        <Controls className="flex items-center justify-between">
          <TableSearch
            onSearch={onSearch}
            width="300px"
          />

          <div className="flex">
            {view !== 'explore' &&
              <>
                <Button
                  component={Link}
                  to="/apps/create-app"
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon/>}
                  size="small"
                  fullWidth
                >
                  Create app
                </Button>

                <Divider orientation="vertical" style={{margin: '0 8px 0 5px'}} flexItem />
              </>
            }

            <LayoutToggle
              layout={viewStyle}
              onClick={view => setViewStyle(view)}
            />
          </div>
        </Controls>
      </Top>


      {rows && viewStyle == 'compact' &&
        <Table
          primaryKey="id"
          enableSorting
          columns={columns}
          rows={rows}
        />
      }

      {rows && view == 'explore' && viewStyle == 'spacious' &&
        <>
          <h2 className="flex items-center">
            <FeaturedIcon/>&nbsp;Featured Apps
          </h2>
          <FeaturedApps
            rows={rows.filter(row => featuredApps.includes(`${row.namespace}/${row.name}`))}
            view={view}
            onComplete={onActionComplete}
            onNavigate={onNavigate}
          />
          <br/>
          <h2 className="flex items-center">
            <SamplersIcon/>&nbsp;Sampling and Integration Apps
          </h2>
          <FeaturedApps
            rows={rows.filter(row => samplers.includes(`${row.namespace}/${row.name}`))}
            view={view}
            onComplete={onActionComplete}
            onNavigate={onNavigate}
          />
          <br/>
        </>
      }

      {rows && view == 'explore' && viewStyle == 'spacious' &&
        <h2 className="flex items-center">
          <PublicIcon/>&nbsp;Other Public Apps
        </h2>
      }

      {rows && viewStyle == 'spacious' &&
        <SpaciousLayout
          rows={rows}
          view={view}
          onComplete={onActionComplete}
          onNavigate={onNavigate}
        />
      }

      {error &&
        <ErrorMsg>{error}</ErrorMsg>
      }

      {!loading && view == 'my-apps' && data?.length == 0 &&
        <NoneFound className="flex column items-center justify-center muted">
          <img src={BeeIcon} />
          <p>You don&apos;t have any apps yet.  Try <Link to="/apps/create-app">creating one</Link>.</p>
        </NoneFound>
      }

      {!loading && view == 'shared-with-me' && data?.length == 0 &&
        <NoneFound className="flex column items-center justify-center muted">
          <img src={BeeIcon} />
          <span>No apps are shared with you</span>
          <small>(sharing is not fully implemented)</small>
        </NoneFound>
      }
    </Root>
  )
}


const Root = styled.div`
  position: relative;
`

const Controls = styled.div`
  background-color: #fff;

  padding: 20px 0 15px 0;
  border-bottom: 1px solid #ddd;

  .MuiButton-root,
  .MuiFormControlLabel-root {
    margin: 0 10px;
  }
`

const NoneFound = styled.div`
  font-size: 2.0em;
  padding-top: 100px;

  img {
    width: 175px;
    margin-right: 20px;
    filter: drop-shadow(0px 0px 0.3rem #ccc);
  }
`

