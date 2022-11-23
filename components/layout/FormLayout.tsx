import styled, { css } from 'styled-components'
import StepIcon from '@mui/material/StepIcon'


export const Main = styled.div`
  margin: 10px 0 40px 0;
  flex-grow: 3;
`

type LabelProps = {
  label: string
  icon: string
}

type StepProps = {
  children: JSX.Element | JSX.Element[]
  label?: string
  icon?: string
  className?: string
  active?: boolean
}

export function Step(props: StepProps) {
  const {className, ...rest} = props
  return (
    <div className={className}>
      {props.label && <StepTitle {...rest} />}
      <StepContent className="step-content">
        {props.children}
      </StepContent>
    </div>
  )
}


export function StepTitle(props: LabelProps) {
  const { label, ...rest } = props

  return (
    <StepTitleRoot>
      <StepIcon active={true} {...rest}/> <h3>{label}</h3>
    </StepTitleRoot>
  )
}

const StepTitleRoot = styled.div`
  display: flex;
  align-items: center;
  font-weight: bold;
  .MuiStepIcon-root {
    margin-right: 5px;
  }
`

const step = css`
  margin: 0px 25px 40px 25px;
`

const StepContent = styled.div`
  ${step}
`

export const StepForm = styled.form`
  ${step}
`
