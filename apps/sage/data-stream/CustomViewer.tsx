import { useState } from 'react'
import {type Record} from '/components/apis/beehive'
import { TablePagination } from '@mui/material'

import PTZYolo from './viewers/PTZApp'

import { ToggleButtonGroup, ToggleButton } from '@mui/material'
import { AnalyticsOutlined, TableRowsOutlined } from '@mui/icons-material'


type Props = {
  data: Record[]
  showViewer: boolean
  onViewModeChange: (val: boolean) => void
}

export default function CustomViewer(props: Props) {
  const {data, showViewer, onViewModeChange} = props
  const [page, setPage] =  useState(0)

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value)
  }

  return (
    <>
      <div className="flex justify-between items-center">

        <ToggleButtonGroup sx={{marginBottom: '1em'}}>
          <ToggleButton
            value="show-viewer"
            selected={showViewer}
            onChange={() => onViewModeChange(true)}
          >
            <AnalyticsOutlined />Custom Viewer
          </ToggleButton>
          <ToggleButton
            value="show-table"
            selected={!showViewer}
            onChange={() => onViewModeChange(false)}
          >
            <TableRowsOutlined /> Table
          </ToggleButton>
        </ToggleButtonGroup>

        {showViewer &&
          <TablePagination
            rowsPerPageOptions={[20]}
            count={data?.length}
            rowsPerPage={20}
            page={page}
            onPageChange={handlePageChange}
          />
        }
      </div>

      {showViewer &&
        <PTZYolo data={data.slice(page * 20, (page + 1) * 20)} />
      }

      {showViewer &&
        <div className="flex justify-center">
          <div></div>
          <TablePagination
            rowsPerPageOptions={[20]}
            count={data?.length}
            rowsPerPage={20}
            page={page}
            onPageChange={handlePageChange}
          />
        </div>
      }
    </>
  )
}