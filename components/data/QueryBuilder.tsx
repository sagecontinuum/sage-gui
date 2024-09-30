import { useState, useEffect, memo } from 'react'
import styled from 'styled-components'

import { TextField, Button, IconButton, MenuItem, Popper, Autocomplete, Popover, Typography } from '@mui/material'
import RmIcon from '@mui/icons-material/DeleteOutlineRounded'
import AddIcon from '@mui/icons-material/AddRounded'

import * as BH from '/components/apis/beehive'

import 'cron-expression-input/lib/cron-expression-input.min.css'
import 'cron-expression-input'

import {
  type Rule,
  type Condition,
  type BooleanLogic,
  booleanLogics, ops,
} from './types.d'
import ConfirmationDialog from '../dialogs/ConfirmationDialog'



declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'cron-expression-input': HTMLElement
    }
  }
}

type ConditionalInputProps =
Condition & {
    names: string[]
    onChange(name: keyof Condition, value: Condition['value'])
  }

function ConditionalInput(props: ConditionalInputProps) {
  const {names, name, onChange} = props

  // support raw text name inputs too
  const [newInput, setNewInput] = useState(false)

  return (
    <div className="flex items-center gap">
      {/*
      <div className="flex column">
        <h4 className="no-margin">Filter</h4>
        <small>
          (<a onClick={() => setNewInput(!newInput)}>
            {newInput ? 'filter menu' : 'free input'}
          </a>)
        </small>
      </div>
      */}

      {newInput ?
        <TextField
          placeholder="env.some.value"
          onChange={(evt) => onChange('name', evt.target.value)}
        /> :
        <Autocomplete
          options={(names || [])}
          renderInput={(props) =>
            <TextField {...props}  />}
          PopperComponent={(props) =>
            <Popper {...props} sx={{minWidth: '400px'}} />}
          value={name}
          onChange={(evt, val) => onChange('name', val)}
          sx={{width: '300px'}}
        />
      }

      <TextField select
        defaultValue={'>'}
        onChange={(evt) => onChange('op', evt.target.value)}
        sx={{width: '70px'}}
      >
        {Object.entries(ops).map(([v, l]) =>
          <MenuItem key={v} value={v}>{l}</MenuItem>
        )}
      </TextField>

      <TextField
        type="number"
        placeholder="3"
        onChange={(evt) => onChange('value', evt.target.value)}
      />
    </div>
  )
}




type RulesProps = {
  rules: Rule[]
  names: string[]
  onChange: (rules: Rule[], booleanLogics: BooleanLogic[]) => void
}

export function Rules(props: RulesProps) {
  const {names, onChange} = props

  const [rules, setRules] = useState<Rule[]>([{name: 'value', op: '>', value: 3}])
  const [logics, setLogics] = useState<BooleanLogic[]>([])
  // const [ontologyNames, setOntologyNames] = useState<string[]>()

  // useEffect(() => {
  //   BH.getData({start: '-30d', tail: 1, filter: {name: 'env.*'}})
  //     .then(data => setOntologyNames([...new Set(data.map(o => o.name))]))
  // }, [])

  useEffect(() => {
    if (!onChange) return
    onChange(rules, logics)
  }, [rules, logics])


  const handleAddRule = (type: 'cron' | 'condition') => {
    if (rules.length >= 1) {
      setLogics(prev => [...prev, 'and'])
    }

    if (type == 'condition') {
      setRules(prev => [...prev, {action: 'schedule', func: 'any', name: 'env.raingauge.uint', op: '>', value: 3}])
    } else {
      throw 'handleAddRule: type of rule (query) not recognized'
    }
  }

  const handleUpdateRule = (i, type: RuleType, name, value) => {
    setRules(prev => {
      const newRule = {...prev[i], [name]: value}
      return prev.map((rule, k) => k == i ? newRule : rule)
    })
  }

  const handleUpdateLogic = (i, value) => {
    setLogics(prev => prev.map((old, k) => k == i ? value : old))
  }

  const handleRmRule = (i) => {
    setRules(prev => prev.filter((_, k) => k != i))
    setLogics(prev => prev.filter((_, k) => k != i))
  }

  return (
    <RulesRoot>
      {rules.map((rule, i) =>
        <RuleInput className="flex column gap" key={i}>
          <div className="flex justify-between">
            <div className="flex items-center gap">
              <ConditionalInput
                {...rule}
                names={names}
                onChange={(name, value) => handleUpdateRule(i, 'condition', name, value)}
              />

              {i < rules.length - 1 &&
                <TextField select
                  defaultValue={'and'}
                  onChange={(evt) => handleUpdateLogic(i, evt.target.value)}
                >
                  {booleanLogics.map(v =>
                    <MenuItem key={v} value={v}>{v}</MenuItem>
                  )}
                </TextField>
              }
              {i == rules.length - 1 && <b></b>}
            </div>
            {rules.length > 1 &&
              <div>
                <IconButton onClick={() => handleRmRule(i)}>
                  <RmIcon/>
                </IconButton>
              </div>
            }
          </div>
        </RuleInput>
      )}
      <br/>
      <div className="flex gap">
        <div className="flex column">
          <div className="flex gap">
            <Button onClick={() => handleAddRule('condition')} variant="outlined"><AddIcon /> Add Filter...</Button>
          </div>
        </div>
      </div>
    </RulesRoot>
  )
}




const RulesRoot = styled.div`

`


const RuleInput = styled.div`
  .cron-amount {
    width: 100px;
  }
`

type Props = {
  rules: Rule[]
  names: string[]
  className?: string
  onSubmit: (rules: Rule[], logics: BooleanLogic[]) => void
}


export default function QueryBuilder(props: Props) {
  const {rules, names, className, onSubmit} = props

  const [data, setData] = useState([])

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const open = Boolean(anchorEl)
  const id = open ? 'simple-popover' : undefined


  return (
    <>
      <Button aria-describedby={id} onClick={handleClick} className={className}>
        Filter Data
      </Button>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
      >
        <Typography sx={{ p: 1 }} className="flex">
          <Rules rules={rules} names={names} onChange={(rules, logics) => setData([rules, logics])}/>

          <Button
            className="self-end"
            onClick={() => onSubmit(data[0], data[1])}
            variant="contained"
          >
            Apply Filters
          </Button>
        </Typography>
      </Popover>
    </>
  )
}
