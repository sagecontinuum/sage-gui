
import { useEffect, useState, memo } from 'react'
import styled from 'styled-components'

import { type Task } from './Assistant'
import * as BH from '/components/apis/beehive'
import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ObjectRenderer from './ObjectRenderer'

import Bee from 'url:./bee.gif'


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
          {expanded && <ObjectRenderer url={value} retry={true} />}
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
  isRunning: boolean
}

export default memo(function Feed(props: Props) {
  const {tasks, isRunning} = props


  const [data, setData] = useState<ParsedRecord[]>()

  useEffect(() => {
    if (!tasks.length) return

    const {fullJobSpec} = tasks[0]
    const {nodes, plugins} = fullJobSpec
    const vsns = Object.keys(nodes)

    // assume one app, for now
    const task = plugins[0].name

    // first, get previous data
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
    if (!tasks.length) return

    const objDiv = document.getElementById('responses')
    if (objDiv)
      objDiv.scrollTop = objDiv.scrollHeight

    const {fullJobSpec} = tasks[0]
    const {nodes, plugins}= fullJobSpec
    const vsns = Object.keys(nodes)

    // assume one app, for now
    const task = plugins[0].name

    const eventSource = BH.createEventSource({vsn: vsns.join('|'), task})

    eventSource.onerror = function(e) {
      console.log('err', e)
    }

    eventSource.onmessage = function(e) {
      const obj = JSON.parse(e.data)

      try {
        obj.value = JSON.parse(obj.value as string)
      } catch (e) {
        // do nothing if not json
      }

      setData(prev => [...prev, obj])
    }

    return () => {
      eventSource.close()
    }
  }, [data, tasks])


  return (
    <Root id="responses">
      <div className="flex justify-end">
        <PromptBubble>
          {tasks[0]?.prompt}
        </PromptBubble>
      </div>
      {data?.map((record, i) => {
        return (
          <div key={i} className="response">
            <Response data={record} showImage={i > data.length - 5 * 2} />
          </div>
        )
      })
      }
      {isRunning &&
        <LoadingBee className="flex column items-center justify-center">
          <img src={Bee} />
          <span>Working on a response...</span>
        </LoadingBee>
      }
    </Root>
  )
}, (prev, next) => JSON.stringify(prev.tasks) == JSON.stringify(next.tasks))


const Root = styled.div`
  overflow-y: scroll;
  width: 100%;
  padding: 40px;
  margin-top: 100px;
  margin-bottom: 150px;

  .response {
    margin-bottom: 30px;

    img {
      max-width: 800px;
    }
  }
`

const PromptBubble = styled.div`
  background: #c6b9ff;
  padding: 5px;
  border-radius: 5px;
  margin-left: auto;
  font-weight: bold;
`

const LoadingBee = styled.div`
  img {
    max-width: 20%;
  }
`