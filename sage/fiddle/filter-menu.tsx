
import {useState, useEffect} from 'react'
import {useLocation, useNavigate} from 'react-router-dom'
import styled from 'styled-components'
import FilterMenu from '../../components/FilterMenu'

import CaretIcon from '@mui/icons-material/ExpandMoreRounded'
import Button from '@mui/material/Button'



const getFilterVal = (items: string[]) => {
  return items.map(v => ({id: v, label: v}))
}

const defaultItem = 'item 1'


export default function FilterMenuTest() {
  const params = new URLSearchParams(useLocation().search)
  const navigate = useNavigate()
  const app = params.get('item')

  const [menus, setMenus] = useState({
    apps: ['item 1', 'item 2', 'item 3'].map(v => ({id: v, label: v}))
  })

  const [filters, setFilters] = useState({
    apps: []
  })


  useEffect(() => {
    setFilters(prev => ({...prev, apps: [app]}))
  }, [app])

  const handleFilterChange = (field: string, val: {id: string, label: string}) => {
    params.set(field, val.id)
    navigate({search: params.toString()})
  }


  return (
    <Root>
      <FilterMenu
        options={menus.apps}
        value={getFilterVal(filters.apps)[0]}
        onChange={val => handleFilterChange('app', val)}
        multiple={false}
        noSelectedSort
        ButtonComponent={<div>
          <Button size="medium">{filters.apps.length ? filters.apps[0] : defaultItem}<CaretIcon /></Button>
        </div>}
      />
    </Root>
  )
}

const Root = styled.div`

`
