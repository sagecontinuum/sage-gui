/* eslint-disable react/display-name */
import React, { useEffect, useState } from 'react'
import { useHistory, useLocation } from 'react-router-dom'
import styled from 'styled-components'

import Table from '../../../components/table/Table'
import * as BH from '../../../admin-ui/apis/beehive'
import { useProgress } from '../../../components/progress/ProgressProvider'

import {msToTime} from '../../../components/utils/units'
import Checkbox from '../../../components/input/Checkbox'
import FilterMenu from '../../../components/FilterMenu'

import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import ArrowBack from '@mui/icons-material/ArrowBackIosRounded'
import ArrowForward from '@mui/icons-material/ArrowForwardIosRounded'
import CaretIcon from '@mui/icons-material/ExpandMoreRounded'

import QueryViewer from '../../../components/QueryViewer'


const relTime = val =>
  msToTime(new Date().getTime() - (new Date(val).getTime()))


const columns = [{
  id: 'timestamp',
  label: 'Time',
  format: (val) => relTime(val)
}, {
  id: 'value',
  label: 'Value',
}, {
  id: 'name',
  label: 'Name',
}, {
  id: 'vsn',
  label: 'VSN',
  format: (val, r) =>
    <a href={`https://admin.sagecontinuum.org/node/${r.host.split('.')[0].toUpperCase()}`} target="_blank" rel="noreferrer">
      {val}
    </a>
}, {
  id: 'job',
  label: 'Job',
}, {
  id: 'sensor',
  label: 'Sensor',
}, {
  id: 'meta',
  label: 'Meta',
  format: (o) =>
    Object.keys(o).map(k => {
      return <div key={`meta-${k}`}><b>{k}</b>: {o[k]}</div>
    })
  ,
  hide: true
}]


const findColumn = (cols, name) =>
  columns.findIndex(o => o.id == name)


type Unit = 'm' | 'h' | 'd'

const units = {
  'm': 'min',
  'h': 'hour',
  // 'd': 'day'
}

type TIProps = {
  page: number
  unit: 'm' | 'h' | 'd'
}

function TimeIndicator(props: TIProps) {
  const {page, unit} = props

  return (
    <div>
      {page == 1 ?
        `now - 1 ${units[unit]} ago` :
        `${page - 1} ${units[unit]} ago - ${page } ${units[unit]} ago`
      }
    </div>
  )
}


const VirtDivider = () =>
  <Divider orientation="vertical" flexItem style={{margin: '5px 15px' }} />

const FilterBtn = ({label}) =>
  <Button>{label}<CaretIcon /></Button>


const getUniqueOpts = (data) =>
  data.filter((v, i, self) => self.indexOf(v) == i)
    .map(v => ({id: v, label: v}))

const getFilterVal = (items: string[]) =>
  items.map(v => ({id: v, label: v}))[0]


async function getFilterSets(plugin) {
  const data = await BH.getData({
    start: `-4d`,
    tail: 1,
    filter: {
      plugin
    }
  })

  return {
    names: getUniqueOpts(data.map(o => o.name)),
    nodes: getUniqueOpts(data.map(o => o.meta.vsn))
  }
}



const defaultPlugin = 'plugin-iio:0.4.5'
const initialState = {
  app: [],
  name: [],
  node: [],
}


export function getFilterState(params) {
  let init = {...initialState}
  for (const [key, val] of params) {
    init[key] = val.split(',')
  }

  return init
}



export default function DataPreview() {
  const params = new URLSearchParams(useLocation().search)
  const history = useHistory()
  const app = params.get('app')
  const name = params.get('names')
  const node = params.get('nodes')

  const {setLoading} = useProgress()

  const [cols, setCols] = useState(columns)

  const [page, setPage] = useState(1)
  const [checked, setChecked] = useState({
    relativeTime: true,
    showMeta: false,
  })

  const [unit, setUnit] = useState<Unit>('m')
  const [data, setData] = useState(null)

  const [apps, setApps] = useState<String[]>()
  const [names, setNames] = useState<String[]>()
  const [nodes, setNodes] = useState<String[]>()

  const [filters, setFilters] = useState({
    app: [defaultPlugin],
    name: [],
    node: [],
  })


  useEffect(() => {
    setFilters({...initialState, app: [app]})
  }, [app])


  useEffect(() => {
    const filterState = getFilterState(params)
    setFilters(filterState)
  }, [name, node])


  useEffect(() => {
    getFilterSets(app)
      .then(({names, nodes}) => {
        setNames(names)
        setNodes(nodes)
      })
  }, [app])


  useEffect(() => {
    async function fetchAppMenu() {
      const query = {
        start: `-2d`,
        tail: 1,
        filter: {
          plugin: `.*`
        }
      }

      setLoading(true)
      BH.getData(query)
        .then((data) => {
          data = getUniqueOpts(data.map(o => o.meta.plugin).filter(n => n))
          setApps(data)
        }).catch(error => setError(error))
    }

    async function fetchData() {
      const query = {
        start: `-${page}${unit}`,
        end: `-${page - 1}${unit}`,
        filter: {
          plugin: app || defaultPlugin,
          ...(node ? {vsn: node} : {}),
          ...(name ? {name} : {}),
        }
      }

      setLoading(true)
      BH.getData(query)
        .then((data) => {
          data = data
            .map(o => ({...o, ...o.meta }))
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          setData(data)
        }).catch(error => setError(error))
        .finally(() => setLoading(false))
    }

    setLoading(true)
    fetchAppMenu()
    fetchData()
  }, [setLoading, page, unit, app, node, name])


  useEffect(() => {
    setCols(prev => {
      let idx
      idx = findColumn(prev, 'timestamp')
      prev[idx] = {...prev[idx], format: val => checked.relativeTime ? relTime(val) : val}
      idx = findColumn(prev, 'meta')
      prev[idx] = {...prev[idx], hide: !checked.showMeta}
      return prev.slice(0)
    })

  }, [checked])


  const handleCheck = (evt, name) => {
    setChecked(prev => ({...prev, [name]: evt.target.checked}))
  }

  const handleFilterChange = (field: string, val: {id: string, label: string}) => {
    params.set(field, val.id)
    history.push({search: params.toString()})
  }

  return (
    <Root>
      <div className="flex items-center">
        <FilterMenu
          options={apps || []}
          value={getFilterVal(filters.app)}
          onChange={val => handleFilterChange('app', val)}
          noSelectedSort
          multiple={false}
          ButtonComponent={<div><FilterBtn label="Apps" /></div>}
        />
        <div className="justify-center">
          <QueryViewer filterState={filters} />
        </div>
      </div>


      <div className="flex justify-between">
        <div className="flex">
          <FormControlLabel
            control={<Checkbox checked={checked.relativeTime} onChange={(evt) => handleCheck(evt, 'relativeTime')} />}
            label="relative time"
          />

          <FormControlLabel
            control={<Checkbox checked={checked.showMeta} onChange={(evt) => handleCheck(evt, 'showMeta')} />}
            label="show meta"
          />
        </div>


        <div className="flex items-center">
          <FilterMenu
            options={names || []}
            value={getFilterVal(filters.name)}
            onChange={vals => handleFilterChange('names', vals)}
            noSelectedSort
            multiple={false}
            ButtonComponent={<div><FilterBtn label="Names" /></div>}
          />

          <FilterMenu
            options={nodes || []}
            value={getFilterVal(filters.node)}
            onChange={vals => handleFilterChange('nodes', vals)}
            noSelectedSort
            multiple={false}
            ButtonComponent={<div><FilterBtn label="Nodes" /></div>}
          />

          <Select
            labelId="units-label"
            id="units"
            value={unit}
            onChange={evt => setUnit(evt.target.value)}
            label="Units"
            size="small"
            margin="dense"
          >
            {Object.keys(units)
              .map(k =>
                <MenuItem value={k} key={k}>{units[k]}</MenuItem>
              )
            }
          </Select>

          <VirtDivider />
          {data && <div>{data.length} record{data.length == 1 ? '' : 's'}</div>}
          <VirtDivider />
          <TimeIndicator page={page} unit={unit}/>
          <VirtDivider />
          <IconButton size="small" onClick={() => setPage(prev => prev - 1)} disabled={page == 1}>
            <ArrowBack fontSize="small"/>
          </IconButton>
          <IconButton size="small" onClick={() => setPage(prev => prev + 1)}>
            <ArrowForward fontSize="small"/>
          </IconButton>
        </div>
      </div>

      {data &&
        <Table
          primaryKey="id"
          enableSorting
          columns={cols}
          rows={data}
        />
      }
    </Root>
  )
}

const Root = styled.div`
  margin: 2em;
`


