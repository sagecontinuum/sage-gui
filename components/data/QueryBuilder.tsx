import { useState, useEffect } from 'react'
import styled from 'styled-components'

import {
  Button, IconButton, Popover, Typography, Slider, Box, OutlinedInput
} from '@mui/material'
import { DeleteOutlineRounded, TuneRounded } from '@mui/icons-material'
// import AddIcon from '@mui/icons-material/AddRounded'

import {
  type Rule,
  type RuleType,
  Range
  // type BooleanLogic
} from './types.d'

import { minBy, maxBy } from 'lodash'
import * as BH from '/components/apis/beehive'



type RulesProps = {
  data: BH.Record[]
  rules: Range[]
  names?: string[]
  onChange: (rules: Rule[]) => void
}

export function Rules(props: RulesProps) {
  const {onChange} = props

  const [rules, setRules] = useState<Range[]>(getInitialRule(props.rules, props.data))

  useEffect(() => {
    if (!onChange) return
    onChange(rules)
  }, [rules])

  const handleUpdateRule = (i, type: RuleType, name, value) => {
    setRules(prev => {
      const newRule = {...prev[i], [name]: value}
      return prev.map((rule, k) => k == i ? newRule : rule)
    })
  }

  const handleRmRule = (i) => {
    setRules(prev => prev.filter((_, k) => k != i))
  }


  /* could support multiple filters
  const [logics, setLogics] = useState<BooleanLogic[]>([])

  const handleAddRule = (type: 'cron' | 'condition') => {
    if (rules.length >= 1) {
      setLogics(prev => [...prev, 'and'])
    }

    if (type == 'condition') {
      setRules(prev => [...prev, {name: 'value', op: '>', value: 3}])
    } else {
      throw 'handleAddRule: type of rule (query) not recognized'
    }
  }

  const handleUpdateLogic = (i, value) => {
    setLogics(prev => prev.map((old, k) => k == i ? value : old))
  }
  */


  return (
    <RulesRoot>
      {rules.map((rule, i) =>
        <RuleInput className="flex column gap" key={i}>
          <div className="flex justify-between">
            <div className="flex items-center gap">
              {/* todo(nc): generalize for types */}
              <Box sx={{ width: 600 }}>
                <Typography gutterBottom>{rule.name}</Typography>

                <div className="flex items-center gap">
                  <OutlinedInput
                    value={rule.value[0]}
                    size="small"
                    onChange={(evt) => handleUpdateRule(i, 'range', rule.name, [evt.target.value, rule.value[1]])}
                    // onBlur={handleBlur}
                    inputProps={{
                      step: 10,
                      min: rule.min,
                      max: rule.max,
                      type: 'number',
                      'aria-labelledby': 'input-slider',
                    }}
                  />
                  <Slider
                    sx={{width: 400}}
                    getAriaLabel={() => 'range'}
                    value={rule.value}
                    onChange={(evt, value) => handleUpdateRule(i, 'range', rule.name, value)}
                    valueLabelDisplay="on"
                    min={rule.min}
                    max={rule.max}
                    step={0.00000001}
                  />
                  <OutlinedInput
                    value={rule.value[1]}
                    size="small"
                    onChange={(evt) => handleUpdateRule(i, 'range', rule.name,  [rule.value[0], evt.target.value])}
                    // onBlur={handleBlur}
                    inputProps={{
                      step: 10,
                      min: rule.min,
                      max: rule.max,
                      type: 'number',
                      'aria-labelledby': 'input-slider',
                    }}
                  />
                </div>
              </Box>

              {i < rules.length - 1 && <span>and</span>}

              {/* could support AND/OR groupings
              {'op' in rule ?
                <ConditionalInput
                  {...rule}
                  names={names}
                  onChange={(name, value) => handleUpdateRule(i, 'condition', name, value)}
                /> :
                <RangeFilter or similar />
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
              */}
              {i == rules.length - 1 && <b></b>}
            </div>
            {rules.length > 1 &&
              <div>
                <IconButton onClick={() => handleRmRule(i)}>
                  <DeleteOutlineRounded/>
                </IconButton>
              </div>
            }
          </div>
        </RuleInput>
      )}
      <br/>
      {/* could support multiple filters
        <div className="flex gap">
          <div className="flex column">

            <div className="flex gap">
              <Button onClick={() => handleAddRule('condition')} variant="outlined"><AddIcon /> Add Filter...</Button>
            </div>
          </div>
        </div>
      */}
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


function getInitialRule(rules, data) {
  if (rules.length > 0 )
    return rules

  const min = Number(minBy(data, 'value')['value'])
  const max = Number(maxBy(data, 'value')['value'])

  return [{name: 'value', value: [min, max], min, max}]
}


type Props = {
  data: BH.Record[]
  rules: Rule[]
  className?: string
  onClear: () => void
  onSubmit: (rules: Rule[]) => void
}


export default function QueryBuilder(props: Props) {
  const {data, rules, className, onClear, onSubmit} = props

  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!anchorEl) return

  }, [anchorEl])

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleRuleChange = (rules) => {
    onSubmit(rules)
  }

  const handleClear = () => {
    onClear()
    handleClose()
  }

  const open = Boolean(anchorEl)
  const id = open ? 'simple-popover' : undefined

  const names = ['value']

  return (
    <>
      <Button aria-describedby={id} onClick={handleClick} className={className} startIcon={<TuneRounded />}>
        Filter Values
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
        <Typography sx={{ p: 1 }}>
          <Rules data={data} rules={rules as Range[]} names={names} onChange={handleRuleChange}/>

          <div className="flex justify-between">
            <Button
              className=""
              onClick={handleClear}
            >
              Clear Filters
            </Button>
            <Button
              className=""
              onClick={handleClose}
              variant="contained"
            >
              Close
            </Button>
          </div>
        </Typography>
      </Popover>
    </>
  )
}
