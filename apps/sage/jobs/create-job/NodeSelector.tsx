import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import Chip from '@mui/material/Chip'
import LaunchIcon from '@mui/icons-material/LaunchRounded'

import Table from '/components/table/Table'
import Map from '/components/Map'
import { queryData } from './createJobUtils'

import * as BK from '/components/apis/beekeeper'
import * as BH from '/components/apis/beehive'

import { pick } from 'lodash'

const cameraTags =  BH.cameraOrientations.map(pos =>
  ({id: `camera_${pos}`, tag: `camera_${pos}`})
)

// todo(nc): note: we need manifests for some of this
const tags = [{
  id: 'node_type',
  tag: 'WSN'
}, {
  id: 'raingauge',
  tag: 'raingauge'
},
  ...cameraTags
]


const queryByTag = (data, tagState: string[]) => {
  // get corresponding keys
  const objKeys = tags
    .filter(o => tagState.includes(o.tag))
    .map(o => o.id)

  // filter matches
  return data.filter(row =>
    Object.values(pick(row, objKeys))
      .join('').toLowerCase() == tagState.join('').toLowerCase()
  )
}


const columns = [{
  id: 'vsn',
  label: 'VSN'
}, {
  id: 'project',
  label: 'Project'
}, {
  id: 'location',
  label: 'Location'
}, {
  id: 'View',
  format: (_, obj) =>
    <Link to={`/node/${obj.node_id}`} target="_blank">
      view node <LaunchIcon className="external-link"/>
    </Link>
}]


const parseManifest = (data) => data.map(o => ({
  ...o,
  lat: o.gps_lat,
  lng: o.gps_lon,
  id: o.vsn,
  status: 'reporting',
  camera_top: o.top_camera != 'none' ? 'camera_top' : false,
  camera_bottom: o.bottom_camera != 'none' ? 'camera_bottom' : false,
  camera_left: o.left_camera != 'none' ? 'camera_left' : false,
  camera_right: o.right_camera != 'none' ? 'camera_right' : false,
  rainguage: 'raingauge'
}))


type Props = {
  onSelected: (apps: BK.Manifest[]) => void
}

export default function NodeSelector(props: Props) {
  const { onSelected } = props

  const [data, setData] = useState<object[]>()
  const [query, setQuery] = useState<string>('')
  const [filtered, setFiltered] = useState<object[]>()
  const [page, setPage] = useState(0)

  const [tagState, setTagState] = useState<string[]>([])


  useEffect(() => {
    BK.getNodeDetails()
      .then(objs => {
        objs = parseManifest(objs)
        setData(objs)
        setFiltered(objs)
      })
  }, [])


  useEffect(() => {
    if (!data) return
    const cols = ['vsn', 'project', 'location']

    let subset = queryData(data, query, cols)
    subset = queryByTag(subset, tagState)

    setFiltered(subset)
  }, [query, tagState])



  const handleSelection = (selected) => {
    onSelected(selected.objs)
  }

  const handleTagFilter = (tag: string) => {
    setTagState(prev =>
      prev.includes(tag) ? prev.filter(v => v != tag) : [...prev, tag]
    )
  }


  return (
    <Root className="flex column">
      <TagFilters>
        {tags.map(({id, tag}) =>
          <TagFilter
            key={tag}
            label={tag}
            onClick={() => handleTagFilter(tag)}
            color={tagState.includes(tag) ? 'primary' : 'default'}
            variant={tagState.includes(tag) ? 'filled' : 'outlined'}
          />
        )}
      </TagFilters>

      <div className="flex">
        {filtered &&
          <TableWrap>
            <Table
              primaryKey="id"
              enableSorting
              checkboxes
              disableClickOutside
              columns={columns}
              rows={filtered}
              pagination
              page={page}
              limit={filtered.length}
              rowsPerPage={10}
              onSearch={({query}) => setQuery(query || '')}
              middleComponent={<div className="flex-grow"></div>}
              onSelect={handleSelection}
            />
          </TableWrap>
        }
        <MapWrap>
          {data &&
            <Map resize={false} data={filtered} selected={null}/>
          }
        </MapWrap>
      </div>
    </Root>
  )
}

const Root = styled.div`

`

const TagFilters = styled.div`
  margin-bottom: 10px;
`

const TagFilter = styled(Chip)`
  margin-right: 10px;
`


const TableWrap = styled.div`
  width: 50%;
  padding-right: 20px;
`
const MapWrap = styled.div`
  margin-top: 60px;
  width: 50%;
`



