import { useState, useEffect } from 'react'
import styled from 'styled-components'

import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import TextField from '@mui/material/TextField'

import { Item } from '../../common/Layout'
import { Accordion, useAccordionStyles } from '../../ecr/app/TagList'

import { AppRow } from './AppSelector'
import Button from '@mui/material/Button'




type SelectedTableProps = {
  selected: AppRow[]
}

export default function SelectedTable(props: SelectedTableProps) {
  const {selected} = props

  const classes = useAccordionStyles()

  const [items, setItems] = useState<AppRow[]>(selected)
  const [form, setForm] = useState<{[app: string]: string}>({})
  const [focusedID, setFocusedID] = useState<AppRow["id"]>(selected[0].id)


  useEffect(() => {
    setItems(selected)
    setFocusedID(selected[0].id)
  }, [selected])


  const handleExpand = (panel: string) => {
    setFocusedID(panel)
  }

  const handleAddAppParam = (name: string, val) => {
    // append to input form
    setForm(prev => ({
      ...prev,
      [name]: (prev[name] ? `${prev[name]} ` : '')  + ' ' + `-${val} `
    }))
  }


  return (
    <SelectedTableRoot>
      {items.map(item => {
        const {id} = item
        const appName = id

        const inputs = items.find(o => o.id == focusedID)?.inputs
        const placeholder = inputs?.map(o => `-${o.id} <${o.type}>`).join(' ')

        return (
          <Accordion
            className={classes.root}
            expanded={focusedID === id}
            onChange={() => handleExpand(id)}
            key={id}
          >

            <AccordionSummary
              expandIcon={<ExpandMoreIcon className="caret"/>}
              aria-controls={`${id}-content`}
              id={`${id}-content`}
            >
              {id}
            </AccordionSummary>

            <AccordionDetails className="flex column">
              <TextField
                label="App params"
                placeholder={placeholder || '-some-param <example>'}
                value={form[focusedID]}
                onChange={evt => setForm({value: evt.target.value})}
                //error={isValid == false}
                //helperText={isValid == false ? 'Sorry, we could not verify github repo url' : ''}
                InputLabelProps={{ shrink: true }}
                required
              />

              <h4>Params:</h4>
              {inputs?.length > 0 &&
                <table>
                  <tbody>
                    {inputs.map(obj => {
                      const {id, type} = obj
                      return (
                        <tr key={id}>
                          <td><Button onClick={() => handleAddAppParam(appName, id)}>{id}</Button></td>
                          <td>{type}</td>
                        </tr>
                      )}
                    )}
                  </tbody>
                </table>
              }

              {!inputs?.length &&
                <div className="muted">None provided to ECR</div>
              }
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

  table {
    width: 20%;
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



