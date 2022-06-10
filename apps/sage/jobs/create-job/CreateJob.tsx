import { useReducer, useState } from 'react'
import styled from 'styled-components'

import TextField from '@mui/material/TextField'

import { Step, StepTitle } from '../../common/FormLayout'

import AppSelector from './AppSelector'
import SelectedAppTable from './SelectedAppTable'
import NodeSelector from './NodeSelector'

import Clipboard from '/components/utils/Clipboard'

import Button from '@mui/material/Button'


// example spec:
//
// name: water-detection
// plugins:
// - name: water-detector
//   pluginSpec:
//     image: seonghapark/surface-water-detection:0.0.6
//     selector:
//       resource.gpu: true
//     args:
//     - -stream
//     - left
//     - -model-path
//     - deeplabv2_resnet101_msc-cocostuff164k-100000.pth
//     - -config-path
//     - configs/cocostuff164k.yaml
// nodeTags:
// - WSN
// - raingauge
// - camera_bottom
// scienceRules:
// - "water-detector: v('env.raingauge.uint') > 3 and cronjob('water-detector', '*/10 * * * *')"
// successcriteria:
// - WallClock(1d)




type Props = {

}


function formReducer(state, action) {
  const {type} = action

  switch (type) {
    case 'set':
      return {
        ...state,
        [action.name]: action.value
      }
    default:
      throw new Error(`formReducer: type "${type}" not valid`)
  }
}

const initState = {}


export default function CreateJob(props: Props) {

  const [form, dispatch] = useReducer(formReducer, initState)
  const [selected, setSelected] = useState([])
  const [selectedNodes, setSelectedNodes] = useState([])

  const [confirm, setConfirm] = useState(false)


  const handleAppSelection = (selected) => {
    setSelected(selected)
  }

  const handleNodeSelection = (selected) => {
    setSelectedNodes(selected)
  }

  const onSubmit = () => {
    setConfirm(true)
  }


  return (
    <Root>
      <main>
        <h1>Create Job (Science Goal)</h1>

        <Step icon="1" label="Your science goal name">
          <TextField
            label="Name"
            placeholder="my science goal"
            value={form.name}
            onChange={evt => dispatch({type: 'set', name: 'name', value: evt.target.value})}
            style={{width: 500}}
          />
        </Step>


        <Step icon="2a" label="Select apps to use">
          <AppSelector onSelected={handleAppSelection}/>
        </Step>

        {selected?.length > 0 && <>
          <Step icon="2b" label="Selected apps / specify params">
            <SelectedAppTable selected={selected} />
          </Step>
        </>}


        <div className="flex items-center">
          <StepTitle icon="3" label="Select nodes"/>
        </div>

        <Step>
          <NodeSelector onSelected={handleNodeSelection} />
        </Step>


        <StepTitle icon="4" label="Create rules" />
        <Step><p className="muted">(under development)</p></Step>


        <StepTitle icon="5" label="Success criteria" />
        <Step><p className="muted">(under development)</p></Step>


        <Step>
          <Button
            onClick={onSubmit}
            variant="outlined"
            color="primary"
            // disabled={disableSubmit()}
            >
            Create Spec
          </Button>
        </Step>

        <Step>
          {confirm &&
            <div>
              <h2>Copy the following spec to use with the Sage Edge Scheduler (SES)</h2>
              <Clipboard content={
                JSON.stringify(
                  {
                    ...form,
                    plugins: selected.map(o => ({pluginSpec: {image: o.id, args: 'fill in'}})),
                    nodes: selectedNodes.map(o => o.vsn)
                  },
                  null, 4
                )}
              />
            </div>
          }
        </Step>
      </main>
    </Root>
  )
}


const Root = styled.div`
  margin: 0 auto;
  max-width: 1280px;
  padding-bottom: 200px;

  main {
    margin: 0 20px;
  }
`


