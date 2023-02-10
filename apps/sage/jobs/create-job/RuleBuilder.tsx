import { useState, useEffect } from 'react'
import styled from 'styled-components'

import { TextField, Button, IconButton, MenuItem, Popper, Autocomplete } from '@mui/material'
import RmIcon from '@mui/icons-material/DeleteOutlineRounded'
import AddIcon from '@mui/icons-material/AddRounded'

import { type AppDetails } from '/components/apis/ecr'

import * as BH from '/components/apis/beehive'

import 'cron-expression-input/lib/cron-expression-input.min.css'
import 'cron-expression-input'

import {
  type ConditionRule,
  type CronRule,
  type Rule,
  type RuleType,
  type BooleanLogic,
  type PublishRule,
  booleanLogics, ops, aggFuncs, SetRule
} from './ses-types.d'



declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'cron-expression-input': HTMLElement
    }
  }
}

type ValueOf<T> = T[keyof T];

type ConditionalInputProps =
  ConditionRule & {
    names: string[]
    onChange(name: keyof ConditionRule, value: ValueOf<ConditionRule>)
  }


function ConditionalInput(props: ConditionalInputProps) {
  const {names, name, onChange} = props

  // support raw text name inputs too
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

      <TextField select
        defaultValue={'any'}
        onChange={(evt) => onChange('func', evt.target.value)}
        sx={{maxWidth: '110px'}}
      >
        {aggFuncs.map(v =>
          <MenuItem key={v} value={v}>{v}</MenuItem>
        )}
      </TextField>

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
        sx={{maxWidth: '60px'}}
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


type PublishInputProps =
  ConditionRule & {
    names: string[]
    onChange(name: keyof PublishRule, value: ValueOf<PublishRule>)
  }


function PublishInput(props: PublishInputProps) {
  const {names, name, onChange} = props

  // support raw text name inputs too
  const [newInput, setNewInput] = useState(false)

  return (
    <div className="flex items-center gap">
      <div className="flex column">
        <h4 className="no-margin">Publish</h4>
        <small>
          (<a onClick={() => setNewInput(!newInput)}>
            {newInput ? 'filter menu' : 'free input'}
          </a>)
        </small>
      </div>

      <TextField
        placeholder="env.some.new.value"
        id="publish-message"
        onChange={(evt) => onChange('publish', evt.target.value)}
      />

      <b>when</b>

      <TextField select
        defaultValue={'any'}
        onChange={(evt) => onChange('func', evt.target.value)}
        sx={{maxWidth: '110px'}}
      >
        {aggFuncs.map(v =>
          <MenuItem key={v} value={v}>{v}</MenuItem>
        )}
      </TextField>

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
        sx={{maxWidth: '60px'}}
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



type SetInputProps =
  ConditionRule & {
    names: string[]
    onChange(name: keyof SetRule, value: ValueOf<SetRule>)
  }


function SetInput(props: SetInputProps) {
  const {names, name, onChange} = props

  // support raw text name inputs too
  const [newInput, setNewInput] = useState(false)

  return (
    <div className="flex items-center gap">
      <div className="flex column">
        <h4 className="no-margin">Set</h4>
        <small>
          (<a onClick={() => setNewInput(!newInput)}>
            {newInput ? 'filter menu' : 'free input'}
          </a>)
        </small>
      </div>

      <TextField
        placeholder="env.some.key"
        id="set-key"
        onChange={(evt) => onChange('stateKey', evt.target.value)}
      />

      <b>as</b>

      <TextField
        placeholder="value"
        id="set-value"
        onChange={(evt) => onChange('state', evt.target.value)}
      />

      <b>when</b>

      <TextField select
        defaultValue={'any'}
        onChange={(evt) => onChange('func', evt.target.value)}
        sx={{maxWidth: '150px'}}
      >
        {aggFuncs.map(v =>
          <MenuItem key={v} value={v}>{v}</MenuItem>
        )}
      </TextField>

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
          sx={{width: '200px'}}
        />
      }

      <TextField select
        defaultValue={'>'}
        onChange={(evt) => onChange('op', evt.target.value)}
        sx={{maxWidth: '60px'}}
      >
        {Object.entries(ops).map(([v, l]) =>
          <MenuItem key={v} value={v}>{l}</MenuItem>
        )}
      </TextField>

      <TextField
        type="number"
        placeholder="3"
        onChange={(evt) => onChange('value', evt.target.value)}
        sx={{maxWidth: '60px'}}
      />
    </div>
  )
}




type CronProps =
  CronRule & {
    onChange(value: string)
  }


function CronInput(props: CronProps) {
  const {cron, onChange} = props

  return (
    <div className="flex items-center gap">
      <h4>Run every</h4>
      <cron-expression-input
        value={cron || '* * * * *'}
        onInput={(evt) => onChange('cron', evt.nativeEvent.detail.value)}
        color="1c8cc9" />
    </div>
  )
}



type RulesProps = {
  appName: string
  onChange: (rules: Rule[], booleanLogics: BooleanLogic[]) => void
}

function Rules(props: RulesProps) {
  const {appName, onChange} = props

  const [rules, setRules] = useState<(CronRule | ConditionRule)[]>([])
  const [logics, setLogics] = useState<BooleanLogic[]>([])
  const [ontologyNames, setOntologyNames] = useState<string[]>()

  useEffect(() => {
    BH.getData({start: '-30d', tail: 1, filter: {name: 'env.*'}})
      .then(data => setOntologyNames([...new Set(data.map(o => o.name))]))
  }, [])

  useEffect(() => {
    onChange(rules, logics)
  }, [rules, logics])


  const handleAddRule = (type: 'cron' | 'condition') => {
    if (rules.length >= 1) {
      setLogics(prev => [...prev, 'and'])
    }

    if (type == 'cron') {
      setRules(prev => [...prev, {action: 'schedule', cron: '* * * * *'}])
    } else if (type == 'condition') {
      setRules(prev => [...prev, {action: 'schedule', func: 'any', name: 'env.raingauge.uint', op: '>', value: 3}])
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
      <ActionTitle>Schedule <b>{appName}</b></ActionTitle>
      {!rules.length &&
        <div className="flex gap">
          <div className="flex column">
            <div className="flex gap">
              <Button onClick={() => handleAddRule('cron')} variant="outlined">Every...</Button>
              <Button onClick={() => handleAddRule('condition')} variant="outlined">Run when...</Button>
            </div>
          </div>
        </div>}


      {rules.map((rule, i) =>
        <RuleInput className="flex column gap" key={i}>
          <div className="flex justify-between">
            <div className="flex items-center gap">
              {'cron' in rule &&
                <CronInput {...rule} onChange={(name, value) => handleUpdateRule(i, 'cron', name, value)} />
              }

              {'func' in rule &&
                <ConditionalInput
                  {...rule}
                  names={ontologyNames}
                  onChange={(name, value) => handleUpdateRule(i, 'condition', name, value)}
                />
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
              {i == rules.length - 1 && <b>and/or</b>}
            </div>
            <div>
              <IconButton onClick={() => handleRmRule(i)}>
                <RmIcon/>
              </IconButton>
            </div>
          </div>

          <div>
            {i == rules.length - 1 &&
              <div className="flex gap">
                <div className="flex column">
                  <div className="flex items-center gap">
                    <Button onClick={() => handleAddRule('cron')} variant="outlined">Every...</Button>
                    <Button onClick={() => handleAddRule('condition')} variant="outlined">Run when...</Button>
                  </div>
                </div>
              </div>}

          </div>
        </RuleInput>
      )}
    </RulesRoot>
  )
}




const RulesRoot = styled.div`

`

const ActionTitle = styled.h4`
  b { color: #000; }
  color: #888;
  border-bottom: 1px solid #aaa;
  padding: 5px 0;
  margin: 0 0 10px 0;
`

const RuleInput = styled.div`
  .cron-amount {
    width: 100px;
  }
`

type PublishRulesProps = {
  onChange: (rules: Rule[], booleanLogics: BooleanLogic[]) => void
}


function PublishRules(props: PublishRulesProps) {
  const { onChange} = props

  const [rules, setRules] = useState<(PublishRule | SetRule)[]>([])

  // note logics are currently not used here
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

    if (type == 'publish') {
      setRules(prev => [...prev, {
        action: type, publish: '', func: 'any', name: 'env.raingauge.uint', op: '>', value: 3
      }])
    } else if (type == 'set') {
      setRules(prev => [...prev, {
        action: type, stateKey: '', func: 'any', state: '', name: 'env.raingauge.uint', op: '>', value: 3
      }])
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
      {!rules.length &&
        <div className="flex gap">
          <div className="flex column">
            <div className="flex gap">
              <Button onClick={() => handleAddRule('publish')} variant="outlined">Publish message...</Button>
            </div>
          </div>
          <div className="flex column">
            <div className="flex gap">
              <Button onClick={() => handleAddRule('set')} variant="outlined">Set state...</Button>
            </div>
          </div>
        </div>}


      {rules.map((rule, i) =>
        <RuleInput className="flex column gap" key={i}>
          <div className="flex items-center justify-between gap">
            {'publish' in rule &&
              <PublishInput
                {...rule}
                names={ontologyNames}
                onChange={(name, value) => handleUpdateRule(i, 'publish', name, value)}
              />
            }

            {'stateKey' in rule &&
              <SetInput
                {...rule}
                names={ontologyNames}
                onChange={(name, value) => handleUpdateRule(i, 'set', name, value)}
              />
            }
            <IconButton onClick={() => handleRmRule(i)}>
              <RmIcon/>
            </IconButton>
          </div>
          <div>
            {i == rules.length - 1 &&
              <div className="flex gap">
                <div className="flex items-center gap">
                  <AddIcon />
                  <div className="flex gap">
                    <Button onClick={() => handleAddRule('publish')} variant="outlined">Publish message...</Button>
                  </div>
                  <div className="flex gap">
                    <Button onClick={() => handleAddRule('set')} variant="outlined">Set state...</Button>
                  </div>
                </div>
              </div>}

          </div>
        </RuleInput>
      )}
    </RulesRoot>
  )
}



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
            <Rules key={id} appName={name} onChange={(rules, logics) => onChange(id, rules, logics)}/>
            <br/>
          </div>
        )
      })}

      <br/>

      <h4 style={{margin: '10px 0' }}>Optional actions:</h4>
      <PublishRules onChange={(rules, logics) => onChange('publishOrSet', rules, logics)} />
    </Root>
  )
}

const Root = styled.div`
  cron-expression-input .modal-dialog {
    margin-top: 200px !important; // override lib
  }
`
