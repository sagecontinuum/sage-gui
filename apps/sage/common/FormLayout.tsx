import styled, { css } from 'styled-components'
import StepIcon from '@mui/material/StepIcon'


export const Main = styled.div`
  margin: 10px 0;
  flex-grow: 3;
`


export function StepTitle(props) {
  return (
    <StepRoot>
      <StepIcon {...props}/> <span>{props.label}</span>
    </StepRoot>
  )
}

const StepRoot = styled.h3`
  display: flex;
  align-items: center;
  font-weight: bold;
  margin-bottom: 10px;
  .MuiStepIcon-root {
    margin-right: 5px;
  }
`


const step = css`
  margin: 0px 25px 40px 25px;
`

export const Step = styled.div`
  ${step}
`

export const StepForm = styled.form`
  ${step}
`
