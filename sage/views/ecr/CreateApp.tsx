import React from 'react'
import styled from 'styled-components'

import TextField from '@material-ui/core/TextField'
import StepIcon from '@material-ui/core/StepIcon'



const Step = (props) => {
  return (
    <StepRoot>
      <StepIcon {...props}/> <span>{props.label}</span>
    </StepRoot>
  )
}

const StepRoot = styled.div`
  display: flex;
  align-items: center;
  font-weight: bold;
  .MuiStepIcon-root {
    margin-right: 5px;
  }
`

export default function CreateApp() {

  const handleRepoChange = (evt) => {
    const val = evt.target.value
  }

  return (
    <Root>
      <Main>
        <Step icon="1" active={true} label="Add New Plugin" />
        <TextField label="Repo URL" onChange={handleRepoChange} style={{width: 500}} />
      </Main>

      <Help>
        <h3 className="no-margin">Help</h3>
        <hr/>
        <a href="https://github.com/waggle-sensor/plugin-helloworld-ml/blob/master/README.md">
          Getting Started
        </a>
      </Help>
    </Root>
  )
}

const Root = styled.div`
  display: flex;
  margin-top: 50px;
`

const Main = styled.div`
  flex-grow: 3;
`

const Help = styled.div`
  flex-grow: 1;
`