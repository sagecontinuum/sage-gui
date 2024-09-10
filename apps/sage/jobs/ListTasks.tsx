import { useEffect, useState } from 'react'
import styled from 'styled-components'

import { Alert, Tooltip } from '@mui/material'
import ErrorIcon from '@mui/icons-material/ErrorOutline'

import type { Job } from '/components/apis/ses'
import { getTasksByApp } from '/components/apis/ses-v2'

import Table, { TableSkeleton } from '/components/table/Table'
import { queryData } from '/components/data/queryData'

import * as Units from '/components/utils/units'

import config from '/config'
import { useProgress } from '/components/progress/ProgressProvider'
const { contactUs } = config



const prettyTime = (d: string) => {
  if (!d) return '-'
  return new Date(d).toLocaleString()// + new Date(d).getMilliseconds()
}

const prettyDiff = (ms: number) => {
  if (ms == 0) return '~0'
  if (!ms) return '-'
  return Units.prettyTimeMS(ms)
}

const cols = [{
  id: 'pluginruntime_pod_instance',
  label: 'Pod'
}, {
  id: 'queued_start',
  label: 'Queued',
  format: prettyTime
}, {
  id: 'selected_start',
  label: 'Selected',
  format: prettyTime,
  hide: true
}, {
  id: 'scheduled_start',
  label: 'Scheduled',
  format: prettyTime,
  hide: true
}, {
  id: 'initializing_start',
  label: 'Initialized',
  format: prettyTime,
  hide: true
}, {
  id: 'running_start',
  label: 'Started',
  format: prettyTime
}, {
  id: 'end_time',
  label: 'Ended',
  format: (v, obj) =>
    obj.failed_start ?
      <Tooltip title={obj.error_log} placement="right">
        <div className="flex items-center gap failed">
          <span>{prettyTime(v)}</span>
          <ErrorIcon fontSize="small"  />
        </div>
      </Tooltip>
      :
      prettyTime(v)
},
// metrics
{
  id: 'metric_queued',
  label: 'Queue Time',
  format: prettyDiff

},  {
  id: 'metric_selected',
  label: 'Selected Time',
  format: prettyDiff
}, {
  id: 'metric_scheduled',
  label: 'Scheduled Time',
  format: prettyDiff

},  {
  id: 'metric_initializing',
  label: 'Initializing Time',
  format: prettyDiff
}, {
  id: 'metric_running',
  label: 'Runtime',
  format: prettyDiff
}]


type Props = {
  job: Job
  start?: string
  showAllTasks?: boolean
}

export default function ListTasks(props: Props) {
  const {job, start, showAllTasks} = props
  const {nodes} = job

  const {setLoading} = useProgress()

  const [data, setData] = useState(null)
  const [qData, setQData] = useState(null)
  const [error, setError] = useState()
  const [page] = useState(0)

  useEffect(() => {
    setLoading(true)
    getTasksByApp({vsns: nodes, start, job, includeAllTasks: showAllTasks})
      .then(byApp => {
        const tasks = [].concat(...Object.values(byApp))

        setData(tasks)
        setQData(tasks)
      }).catch(error =>
        setError(error)
      ).finally(() => setLoading(false))
  }, [start, showAllTasks])


  const handleQuery = ({query}) => {
    setQData(queryData(data, query))
  }

  return (
    <>
      <TableContainer>
        {qData &&
          <Table
            primaryKey="pluginruntime_pod_instance"
            rows={qData}
            columns={cols}
            storageKey="task-listing"
            enableSorting
            pagination
            page={page}
            limit={qData.length} // todo(nc): "limit" is fairly confusing
            rowsPerPage={25}
            onSearch={handleQuery}
            sort="-running_start"
            onColumnMenuChange={() => { /* do nothing */ }}
            emptyNotice="No tasks found"
            // onSelect={handleSelect}
            middleComponent={<div></div>}
          />
        }
        {!data && !error &&
          <TableSkeleton />
        }

        {error &&
          <Alert severity="info">
            {error}<br/>
            Please <b><a href={contactUs}>contact us</a></b> if you think this could be a mistake.
          </Alert>
        }
      </TableContainer>
    </>
  )
}



const TableContainer = styled.div`
  margin-top: 1rem;
`



