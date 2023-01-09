import { useState } from 'react'

import Accordion, { useAccordionStyles } from '/components/layout/Accordion'
import { AccordionDetails, AccordionSummary } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreRounded'

import { stringify } from 'yaml'

type Props = {
  data: {
    name: string,
    goal_id: string,
    plugin_spec: object
  }[]
}

export default function ParamDetails(props: Props) {
  const {data} = props

  const classes = useAccordionStyles()

  const [expanded, setExpanded] = useState<number>(null)

  const handleChange = (panel: number) => (_, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : null)
  }

  return (
    <div>
      {data.map((app, i) => {
        const {name, goal_id, plugin_spec} = app

        return (
          <Accordion
            className={classes.root}
            expanded={expanded == i}
            onChange={handleChange(i)}
            key={goal_id}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${goal_id}-content`}
              id={`${goal_id}-content`}
            >
              {name}
            </AccordionSummary>
            <AccordionDetails>
              <b>Goal ID:</b> {goal_id}
              <pre>
                {stringify(plugin_spec)}
              </pre>
            </AccordionDetails>
          </Accordion>
        )
      })
      }
    </div>
  )
}

