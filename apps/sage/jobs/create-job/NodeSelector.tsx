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
import * as User from '/components/apis/user'

import { pick } from 'lodash'

import { FormControlLabel, ToggleButtonGroup, ToggleButton } from '@mui/material'
import Checkbox from '/components/input/Checkbox'

import Auth from '/components/auth/auth'


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

  const [data, setData] = useState<BK.NodeDetails>()
  const [query, setQuery] = useState<string>('')
  const [filtered, setFiltered] = useState<object[]>()
  const [page, setPage] = useState(0)
  const [updateID, setUpdateID] = useState(0)

  const [tagState, setTagState] = useState<string[]>([])

  const [bucket, setBucket] = useState<BK.Manifest['bucket']>(BK.Buckets[0])

  const [schedulable, setSchedulable] = useState<BK.VSN[]>()
  const [isSchedulable, setIsSchedulable] = useState<boolean>(false)

  useEffect(() => {
    const p1 = BK.getNodeDetails(bucket)
    const p2 = User.listHasPerm('schedule')

    Promise.all(([p1, p2]))
      .then(([objs, schedulable]) => {
        objs = parseManifest(objs)

        if (isSchedulable) {
          objs = objs.filter(o => schedulable.includes(o.vsn))
        }

        setSchedulable(schedulable)
        setData(objs)
        setFiltered(objs)
      })

  }, [bucket, isSchedulable])


  useEffect(() => {
    if (!data) return
    const cols = ['vsn', 'project', 'location']

    let subset = queryData(data, query, cols)
    subset = queryByTag(subset, tagState)
    setFiltered(subset)

    // force update map
    setUpdateID(prev => prev + 1)
  }, [query, tagState, data])



  const handleSelection = (selected) => {
    onSelected(selected.objs)
  }

  const handleTagFilter = (tag: string) => {
    setTagState(prev =>
      prev.includes(tag) ? prev.filter(v => v != tag) : [...prev, tag]
    )
  }

  const handleBucketChange = (_, val) => {
    setBucket(val)
  }

  const tableProps = Auth.user ? {
    disableRowSelect: (row) => !schedulable.includes(row.vsn),
    greyRow: (row) => !schedulable.includes(row.vsn),
    stripe: false
  } : {}


  return (
    <Root className="flex column">
      <div className="flex justify-between items-center">
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

        <div>
          {Auth.user &&
            <FormControlLabel
              control={
                <Checkbox
                  checked={isSchedulable}
                  onChange={(evt) => setIsSchedulable(evt.target.checked)}
                />
              }
              label="Schedulable"
            />
          }

          <ToggleButtonGroup
            value={bucket}
            onChange={(evt, val) => handleBucketChange(evt, val)}
            aria-label="node type"
            exclusive
            size="small"
          >
            {BK.Buckets.slice(0, 3).map(bucket => {
              const name = bucket.split(' ')[1]
              return (
                <ToggleButton value={bucket} aria-label={`${name} nodes`} key={bucket}>
                  {name}
                </ToggleButton>
              )
            })}
          </ToggleButtonGroup>
        </div>
      </div>

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
              {...tableProps}
            />
          </TableWrap>
        }
        <MapWrap>
          {filtered &&
            <Map data={filtered} updateID={updateID} />
          }
        </MapWrap>
      </div>
    </Root>
  )
}

const Root = styled.div`

`

const TagFilters = styled.div``

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



