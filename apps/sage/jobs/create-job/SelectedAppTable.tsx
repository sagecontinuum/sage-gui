import { useState, useEffect } from 'react'
import styled from 'styled-components'

import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { TextField } from '@mui/material'

import Accordion, { useAccordionStyles } from '/components/layout/Accordion'
import Checkbox from '/components/input/Checkbox'

import { appIDToName } from './createJobUtils'
import { type ArgStyles } from './ses-types'
import { type AppRow } from './AppSelector'


const placeholder = {
  int: '123',
  float: '123.123 (a float)',
  string: 'some string'
}


type FormState = {
  [app: string]: {
    [input: string]: number | boolean | string
  }
}


type SelectedTableProps = {
  selected: AppRow[]
  appArgs: FormState
  argStyles: ArgStyles  // todo(nc): remove
  onChange: (appID: string, field: string, checkName?: string) => void
}

export default function SelectedTable(props: SelectedTableProps) {
  const {selected, appArgs: form, argStyles, onChange} = props

  const classes = useAccordionStyles()

  const [items, setItems] = useState<AppRow[]>(selected)
  const [focusedID, setFocusedID] = useState<AppRow['id']>(selected[0].id)


  // controlled input of selected apps and their params
  useEffect(() => {
    setItems(selected)
  }, [selected])


  const handleExpand = (id: string) => {
    setFocusedID(id)
  }

  /* allow raw string input?
  const handleUpdateCLIString = (evt, appID: string) => {
    const value = evt.target.value

    const {mapping} = argListToMap(value.split(' '))
    Object.keys(mapping).forEach(key => {
      if (form[key] != mapping[key]) {
        onChange(appID, key, mapping[key])
      }
    })
  }
  */

  const getAppParamString = (appID: string) : string => {
    const f = form[appID]
    if (!f)
      return ''

    const argStyle = argStyles[appID] || '-'

    return Object.entries(f)
      .filter(([key]) => key != 'appName')
      .map(([key, val]) => `${argStyle}${key}` + (val != null ? ` ${val}` : '')).join(' ')
  }


  return (
    <SelectedTableRoot>
      {items.map(item => {
        const appID = item.id
        const appName = appID

        const inputs = items.find(o => o.id == focusedID)?.inputs
        const phText = inputs?.map(o => `-${o.id} <${o.type}>`).join(' ')

        return (
          <Accordion
            className={classes.root}
            expanded={focusedID === appID}
            onChange={() => handleExpand(appID)}
            key={appID}
          >

            <AccordionSummary
              expandIcon={<ExpandMoreIcon className="caret"/>}
              aria-controls={`${appID}-content`}
              id={`${appID}-content`}
            >
              {appID}
            </AccordionSummary>

            <AccordionDetails className="flex column">
              <TextField
                label="Name"
                placeholder="name"
                name="pluginName"
                defaultValue={appIDToName(appID)}
                onChange={(evt) => onChange(appName, 'appName', evt.target.value)}
                sx={{width: '30%'}}
              />
              <br/>

              {inputs?.length > 0 &&
                <h3 className="no-margin">Input Arguments</h3>}

              {!inputs?.length &&
                <div className="muted">No input arguments provided to ECR</div>}

              {inputs?.length > 0 &&
                <table className="simple">
                  <tbody>
                    {inputs.map(obj => {
                      const {id, type} = obj

                      return (
                        <tr key={id}>
                          <td>{id}</td>
                          <td>{type}</td>
                          <td>
                            {type == 'boolean' &&
                              <Checkbox
                                checked={(appID in form && id in form[appID] && form[appID][id] == null) ? true : false}
                                onChange={(evt) => onChange(appName, id, evt.target.checked)}
                              />
                            }
                            {type != 'boolean' &&
                              <TextField
                                type={['int', 'float'].includes(type) ? 'number' : 'text'}
                                placeholder={placeholder[type]}
                                name={id}
                                value={(form[appID] && id in form[appID]) ? form[appID][id] : ''}
                                onChange={(evt) => onChange(appName, id, evt.target.value)}
                              />
                            }
                          </td>
                          <td></td>
                        </tr>
                      )}
                    )}
                  </tbody>
                </table>
              }

              <h4>{inputs?.length ? 'Input Arguments Preview' : 'Input Arguments'}</h4>
              <pre>{getAppParamString(appName)}</pre>
              {/* allow raw string input?
              <TextField
                label="App params"
                placeholder={phText || '-some-param <example>'}
                value={getAppParamString(appName)}
                onChange={evt => handleUpdateCLIString(evt, appID)}
                InputLabelProps={{ shrink: true }}
              />*/}
            </AccordionDetails>
          </Accordion>
        )
      }
      )}

    </SelectedTableRoot>
  )
}



const SelectedTableRoot = styled.div`
  margin-bottom: 50px;

  transition: height 2s ease-in;

  ul {
    width: 50%;
    margin: 0;
  }
`


