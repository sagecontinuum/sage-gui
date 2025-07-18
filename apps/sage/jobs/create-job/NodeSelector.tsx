import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import LaunchIcon from '@mui/icons-material/LaunchRounded'

import Table from '/components/table/Table'
import Map from '/components/Map'
import { queryData } from './createJobUtils'

import * as BK from '/components/apis/beekeeper'
import * as BH from '/components/apis/beehive'
import * as User from '/components/apis/user'

import { pick } from 'lodash'

import { Chip, FormControlLabel } from '@mui/material'
import Checkbox from '/components/input/Checkbox'

import Auth from '/components/auth/auth'


const cameraTags =  BH.cameraOrientations.map(pos =>
  ({id: `camera_${pos}`, tag: `camera_${pos}`})
)

// todo(nc): note: we need nodeMetas for some of this
const tags = [{
  id: 'type',
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
  label: 'Node'
}, /* todo(nc): ignore for now {
  id: 'project',
  label: 'Project'
}, */ {
  id: 'city',
  label: 'City'
}, {
  id: 'View',
  format: (_, obj) =>
    <Link to={`/node/${obj.vsn}`} target="_blank">
      view node <LaunchIcon className="external-link"/>
    </Link>
}]


// add in camera meta for use in auto-complete;
export const parseNodeMeta = (data) => data.map(o => ({
  ...o,
  top_camera: o.sensors.find(o => o.name == 'top_camera')?.hw_model,
  bottom_camera: o.sensors.find(o => o.name == 'bottom_camera')?.hw_model,
  left_camera: o.sensors.find(o => o.name == 'left_camera')?.hw_model,
  right_camera: o.sensors.find(o => o.name == 'right_camera')?.hw_model
}))


type Props = {
  selected: BK.VSN[]
  onSelected: (nodes: BK.VSN[]) => void
  checkPerms?: boolean
}

export default function NodeSelector(props: Props) {
  const { selected = [], onSelected, checkPerms = false } = props

  const [data, setData] = useState<BK.Node[]>()
  const [query, setQuery] = useState<string>('')
  const [filtered, setFiltered] = useState<object[]>()
  const [page] = useState(0)
  const [updateID, setUpdateID] = useState(0)

  const [tagState, setTagState] = useState<string[]>([])

  const [availNodes, setAvailNodes] = useState<BK.VSN[]>()
  const [isSchedulable, setIsSchedulable] = useState<boolean>(checkPerms)


  useEffect(() => {
    const p1 = BK.getNodes()
    const p2 = isSchedulable ? User.listNodesWithPerm('schedule') : null

    Promise.all(isSchedulable ? [p1, p2] : [p1])
      .then(([objs, availNodes]) => {
        objs = parseNodeMeta(objs)

        if (isSchedulable) {
          objs = objs.filter(o => availNodes.includes(o.vsn))
        }

        setAvailNodes(availNodes)
        setData(objs)
        setFiltered(objs)
      })

  }, [isSchedulable])


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
    onSelected(selected.objs.map(o => o.vsn))
  }

  const handleTagFilter = (tag: string) => {
    setTagState(prev =>
      prev.includes(tag) ? prev.filter(v => v != tag) : [...prev, tag]
    )
  }

  const handleRemoveChip = (vsn: BK.VSN) => {
    onSelected(selected.filter(selVSN => selVSN != vsn))
  }

  const tableProps = Auth.user & isSchedulable ? {
    disableRowSelect: (row) => !availNodes.includes(row.vsn),
    greyRow: (row) => !availNodes.includes(row.vsn),
    stripe: false
  } : {}


  return (
    <Root className="flex column">
      <div className="flex justify-between items-center">
        {checkPerms &&
          <TagFilters>
            {tags.map(({tag}) =>
              <TagFilter
                key={tag}
                label={tag}
                onClick={() => handleTagFilter(tag)}
                color={tagState.includes(tag) ? 'primary' : 'default'}
                variant={tagState.includes(tag) ? 'filled' : 'outlined'}
              />
            )}
          </TagFilters>
        }

        <div>
          {Auth.user && checkPerms &&
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

          {/*
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
          */}
        </div>
      </div>

      <div className="flex">
        {filtered &&
          <TableWrap>
            <Table
              primaryKey="vsn"
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
              // @ts-ignore: revisit "selected" and MapData types if this component is used
              selected={selected}
              onSelect={handleSelection}
              {...tableProps}
            />
          </TableWrap>
        }
        <MapWrap>
          {filtered &&
            // @ts-ignore: revisit "selected" and MapData types if these component is used
            <Map data={filtered} updateID={updateID} />
          }
        </MapWrap>
      </div>

      <div>
        <SelectedChips className="flex gap">
          {selected.map((node) =>
            <Chip
              key={node}
              label={node}
              variant="filled"
              color="primary"
              onDelete={() => handleRemoveChip(node)} />
          )}
        </SelectedChips>
      </div>
    </Root>
  )
}

const Root = styled.div`
  width: 100%;
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

const SelectedChips = styled.div`
  margin-top: 10px;
`



