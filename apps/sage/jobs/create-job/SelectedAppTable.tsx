import { useState, useEffect } from 'react'
import styled from 'styled-components'

import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TextField from '@mui/material/TextField'

import { Item } from '../../common/Layout'
import { Accordion, useAccordionStyles } from '../../ecr/app/TagList'
import Checkbox from '/components/input/Checkbox'

import { type AppRow } from './AppSelector'


const placeholder = {
  int: 123,
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
  onChange: (form: FormState) => void
}

export default function SelectedTable(props: SelectedTableProps) {
  const {selected, onChange} = props

  const classes = useAccordionStyles()

  const [items, setItems] = useState<AppRow[]>(selected)
  const [form, setForm] = useState<FormState>({})
  const [focusedID, setFocusedID] = useState<AppRow["id"]>(selected[0].id)


  useEffect(() => {
    setItems(selected)
    setFocusedID(selected[0].id)
  }, [selected])


  useEffect(() => {
    onChange(form)
  }, [form])


  const handleExpand = (panel: string) => {
    setFocusedID(panel)
  }

  // todo(nc): allow name attr on checkbox input!
  const handleUpdateForm = (evt, appName: string, checkName?: string) => {
    const {type, name, value, checked} = evt.target

    if (type == 'checkbox') {
      setForm(prev => ({...prev, [appName]: {...prev[appName], [checkName]: checked}}))
    } else {
      setForm(prev => ({...prev, [appName]: {...prev[appName], [name]: value}}))
    }
  }

  const getAppParamString = (appName) => {
    const f = form[appName]
    if (!f)
      return ''

    return Object.keys(f).map(field => `-${field} ${f[field]}`).join(' ')
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
                                checked={(appName in form && id in form[appName] && form[appName][id]) ? true : false}
                                onChange={(evt) => handleUpdateForm(evt, appName, id)}
                              />
                            }
                            {type != 'boolean' &&
                              <TextField
                                size="small"
                                type={['int', 'float'].includes(type) ? 'number' : 'text'}
                                placeholder={placeholder[type]}
                                name={id}
                                onChange={(evt) => handleUpdateForm(evt, appName)}
                              />
                            }
                          </td>
                        </tr>
                      )}
                    )}
                  </tbody>
                </table>
              }

              <h4>{inputs?.length ? 'Input Arguments Preview' : 'Input Arguments'}</h4>
              <TextField
                label="App params"
                placeholder={phText || '-some-param <example>'}
                value={getAppParamString(appName)}
                onChange={evt => setForm({value: evt.target.value})}
                InputLabelProps={{ shrink: true }}
              />
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

const ListItem = styled(Item)`
  margin: 0;
  border-left: 2px solid #ddd;
  border-top-left: 0;

  :hover {
    border: inherit;
    border-left: 2px solid rgb(28, 140, 201);
  }
`



