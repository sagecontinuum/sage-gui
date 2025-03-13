
import { useEffect, useState } from 'react'
import styled from 'styled-components'

import { type Task } from './Assistant'
import * as BH from '/components/apis/beehive'
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'


type ParsedRecord = BH.Record | (BH.Record & {value: {query: string, answer}})

type ResponseProps = {
  data: ParsedRecord
  showImage?: boolean
}

function Response(props: ResponseProps) {
  const {data, showImage} = props
  const {value} = data

  const [expanded, setExpanded] = useState<boolean>(showImage)

  const handleChange = (_, open) => {
    setExpanded(open)
  }

  let ele = 'loading...'
  if (typeof value == 'object' && value) {
    ele = <p>{value.answer}</p>
  } else if (typeof value == 'string' && value.includes('https://')) {
    ele =
      <Accordion expanded={expanded} onChange={handleChange}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1-content"
          id="panel1-header"
        >
          <Typography component="span">Image</Typography>
        </AccordionSummary>
        <AccordionDetails>
          {expanded && <img src={value} />}
        </AccordionDetails>
      </Accordion>
  } else {
    ele = value
  }

  return (
    <div>
      {ele}
    </div>
  )
}


type Props = {
  tasks: Task[]
}

export default function Feed(props: Props) {
  const {tasks} = props


  const [data, setData] = useState<ParsedRecord[]>()

  useEffect(() => {
    if (!tasks.length) return

    const {fullJobSpec} = tasks[0]

    const {nodes, plugins} = fullJobSpec

    const vsns = Object.keys(nodes)

    // assume one app, for now
    const task = plugins[0].name

    BH.getData({
      start: '-1d',
      filter: {
        vsn: vsns.join('|'),
        task
      }
    }).then(res => {
      let d = res.sort((a, b) =>
        b.timestamp.localeCompare(a.timestamp)
      )

      d = res.map(obj => {
        try {
          obj.value = JSON.parse(obj.value as string)
        } catch (e) {
          // do nothing if not json
        }

        return obj
      })

      setData(d)
    })
  }, [tasks])

  useEffect(() => {
    const objDiv = document.getElementById('responses')
    if (objDiv)
      objDiv.scrollTop = objDiv.scrollHeight
  }, [data])

  return (
    <Root id="responses">
      {data?.map((record, i) => {
        return (
          <div key={i} className="response">
            <Response data={record} showImage={i > data.length - 5 * 2} />
          </div>
        )
      })
      }
    </Root>
  )
}

const Root = styled.div`
  overflow-y: scroll;
  padding: 40px;
  margin-bottom: 150px;

  .response {
    margin-bottom: 30px;

    img {
      max-width: 800px;
    }
  }
`