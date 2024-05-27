import styled from 'styled-components'

import Menu from './Menu'

import DownloadIcon from '@mui/icons-material/CloudDownloadOutlined'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'


export default function DownloadTableBtn({onDownload}) {
  return (
    <DownloadContainer>
      <Menu
        button={
          <Tooltip title="View download options..." placement="top">
            <IconButton aria-label="download" size="small">
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        }
      >
        <DownloadTitle>Download Table As...</DownloadTitle>
        <MenuItem onClick={() => onDownload('text/csv')}>Displayed Data as CSV</MenuItem>
        {/* <MenuItem onClick={() => onDownload('text/tsv')}>Text</MenuItem> */}
      </Menu>
    </DownloadContainer>
  )
}

export function formatDownloadCol(item: string | object | (string | number | object)[]) {
  if (typeof item == 'string')
    return item.includes(',') ? `"${item}"` : item
  else if (Array.isArray(item)) {
    if (typeof item[0] == 'object')
      return item.map(o => JSON.stringify(o)).join(', ')
    else
      return item.join(', ')
  } else if (typeof item == 'object')
    return JSON.stringify(item)
}



const DownloadContainer = styled.div`
  margin-left: 10px;
  padding-right: 5px;

  img {
    width: 20px;
    filter: contrast(40%);
  }
`

const DownloadTitle = styled.div`
  font-weight: bold;
  width: 100%;
  background: #2e76a3;
  color: #f2f2f2;
  padding: 4px 5px;
`