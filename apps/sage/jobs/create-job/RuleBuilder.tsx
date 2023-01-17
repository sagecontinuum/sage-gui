import { useState, useEffect } from 'react'
import styled from 'styled-components'

import { TextField, Button, InputAdornment, IconButton, MenuItem } from '@mui/material'
import CaretIcon from '@mui/icons-material/ExpandMoreRounded'
import RmIcon from '@mui/icons-material/DeleteOutlineRounded'

import FilterMenu from '/components/FilterMenu'

import { type AppDetails } from '/components/apis/ecr'

import * as BH from '/components/apis/beehive'


/**
 * input const lists and rule types
 */

const cronUnits = ['min', 'hour', 'day', 'month'] as const
const ops = {'<': '<', '>': '>', '=': '=', '<=': '≤', '>=': '≥'} as const
const booleanLogics = ['and', 'or'] as const

type CronUnit = typeof cronUnits[number]
type Op = keyof typeof ops
type BooleanLogic = typeof booleanLogics[number]

type Rule = ConditionRule | CronRule
type RuleType = 'condition' | 'cron'

type ConditionRule = {
  name: string
  op: Op
  value: number
}

type CronRule = {
  amount: number
  unit: CronUnit
}

export { Rule, BooleanLogic, CronRule}



type ConditionalInputProps =
  ConditionRule & {
    names: string[]
    onChange(name: keyof ConditionRule, value: ConditionRule['value'])
  }


function ConditionalInput(props: ConditionalInputProps) {
  const {names, name, onChange} = props

  const [newInput, setNewInput] = useState(false)

  return (
    <div className="flex items-center gap">
      <div className="flex column">
        <h4 className="no-margin">Run when</h4>
        <small>
          (<a onClick={() => setNewInput(!newInput)}>
            {newInput ? 'filter menu' : 'free input'}
          </a>)
        </small>
      </div>

      {newInput ?
        <TextField
          placeholder="env.some.value"
          onChange={(evt) => onChange('name', evt.target.value)}
        /> :
        <FilterMenu
          options={(names || []).map(n => ({id: n, label: n}))}
          multiple={false}
          disableCloseOnSelect={false}
          onChange={(val) => onChange('name', val?.id)}
          value={{id: name, label: name}}
          ButtonComponent={
            <Button>{name} <CaretIcon /></Button>
          }
        />
      }

      <TextField select
        defaultValue={'>'}
        onChange={(evt) => onChange('op', evt.target.value)}
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



type CronProps =
  CronRule & {
    onChange(name: 'amount' | 'unit', value: number | string)
  }


function CronInput(props: CronProps) {
  const { amount, unit, onChange} = props

  return (
    <div className="flex items-center gap">
      <h4>Run on every</h4>
      <TextField
        type="number"
        value={amount}
        placeholder="5"
        className="cron-amount"
        onChange={evt => onChange('amount', evt.target.value)}
        InputProps={{
          endAdornment: <InputAdornment position="end">th</InputAdornment>
        }}
      />

      <FilterMenu
        options={
          cronUnits.map(unit => ({id: unit, label: unit.toUpperCase()}))
        }
        multiple={false}
        onChange={val => onChange('unit', val.id)}
        value={{id: unit, label: unit}}
        ButtonComponent={
          <Button>{unit} <CaretIcon /></Button>
        }
      />
    </div>
  )
}




/**
 *  minimal app example
/*
const apps = [{
  "id": "dariodematties1/avian-diversity-monitoring:0.2.4",
  "inputs": [],
  "name": "avian-diversity-monitoring",
  "namespace": "dariodematties1",
  "owner": "dariodematties1",
  "time_last_updated": "2022-04-15T17:33:31Z",
  "version": "0.2.4"
}]
*/



type RulesProps = {
  onChange: (rules: Rule[], booleanLogics: BooleanLogic[]) => void
}

function Rules(props: RulesProps) {
  const {onChange} = props

  const [rules, setRules] = useState<Rule[]>([])
  const [logics, setLogics] = useState<BooleanLogic[]>([])
  const [ontologyNames, setOntologyNames] = useState<string[]>()

  useEffect(() => {
    BH.getData({start: '-30d', tail: 1, filter: {name: 'env.*'}})
      .then(data => setOntologyNames([...new Set(data.map(o => o.name))]))
  }, [])

  useEffect(() => {
    onChange(rules, logics)
  }, [rules, logics])


  const handleAddRule = (type: RuleType) => {
    if (rules.length >= 1) {
      setLogics(prev => [...prev, 'and'])
    }

    if (type == 'cron') {
      setRules(prev => [...prev, {amount: 5, unit: 'min'}])
    } else if (type == 'condition') {
      setRules(prev => [...prev, {name: 'env.raingauge.uint', op: '>', value: 3}])
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
    <div>
      {!rules.length && <div className="flex gap">
        <Button onClick={() => handleAddRule('condition')} variant="outlined">Run when...</Button>
        <Button onClick={() => handleAddRule('cron')} variant="outlined">Run every...</Button>
      </div>}


      {rules.map((rule, i) =>
        <RuleInput className="flex items-center justify-between" key={i}>
          <div className="flex items-center gap">
            {'amount' in rule &&
              <CronInput {...rule} onChange={(name, value) => handleUpdateRule(i, 'cron', name, value)} />
            }

            {'name' in rule &&
              <ConditionalInput
                {...rule}
                names={ontologyNames}
                onChange={(name, value) => handleUpdateRule(i, 'condition', name, value)}
              />
            }

            {i == rules.length - 1 &&
              <b>and/or</b>
            }

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

            {i == rules.length - 1 &&
              <>
                <Button onClick={() => handleAddRule('condition')} variant="outlined">Run when...</Button>
                <Button onClick={() => handleAddRule('cron')} variant="outlined">Run every...</Button>
              </>
            }
          </div>

          <IconButton onClick={() => handleRmRule(i)}><RmIcon/></IconButton>

        </RuleInput>
      )}
    </div>
  )
}


const RuleInput = styled.div`
  .cron-amount {
    width: 100px;
  }
`


type Props = {
  apps: AppDetails[]
  onChange: (app: string, rules: Rule[], logics: BooleanLogic[]) => void
}


export default function RuleBuilder(props: Props) {
  const {apps, onChange} = props

  return (
    <Root>
      {apps.map(app => {
        const {id, name} = app

        return (
          <div key={id}>
            <p>Rules for: <b>{name}</b></p>
            <Rules key={id} onChange={(rules, logics) => onChange(id, rules, logics)}/>
          </div>
        )
      })}
    </Root>
  )
}

const Root = styled.div`

`

