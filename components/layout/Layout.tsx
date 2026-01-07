import { type ReactElement } from 'react'

import { styled, GlobalStyles } from '@mui/material'
import MuiDivider from '@mui/material/Divider'
import { Card as MuiCard, type CardProps } from '@mui/material'

export const Item = styled(MuiCard)`
  position: relative;
  margin: 20px 1px; // 1px left/right for sticky header
  padding: 10px 15px;
  border: 1px solid ${props => props.theme.palette.divider};
  border-radius: 5px;
  box-shadow: 0px 0px 1px 1px ${props => props.theme.palette.grey[100]};
  color: ${props => props.theme.palette.text.primary};

  :hover {
    text-decoration: none;
    border: 1px solid ${props => props.theme.palette.primary.main};
  }

  .actions {
    position: absolute;
    display: none;
    background: ${props => props.theme.palette.background.paper};
    bottom: .5rem;
    right: .6rem;
  }

  :hover .actions {
    display: block;
  }
`

export const Title = styled('h2')`
  margin: 0;
`

export const Top = styled('div')<{top?: string}>`
  position: sticky;
  top: ${props => props.top || '60px'};
  z-index: 100;
`

export const Controls = styled('div')`
  background-color: ${props => props.theme.palette.background.paper};
  padding: 10px 0;
  border-bottom: 1px solid ${props => props.theme.palette.divider};

  .checkboxes {
    margin-top: 17px;
  }
`

export const Divider = () =>
  <MuiDivider orientation="vertical" flexItem style={{margin: '0px 20px'}} />

export const Sidebar = styled('div')<{width?: string}>`
  position: sticky;
  top: 60px;
  height: calc(100vh);
  padding-top: 10px;
  width: ${props => props.width || '250px'};
  min-width: ${props => props.width || '250px'};
  border-right: 1px solid ${props => props.theme.palette.divider};
  background: ${({ theme }) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f8f8'};
  overflow-y: scroll;
`

export const FilterTitle =  styled('h2')`
  margin-left: 20px;
`


// second version of card design (WIP)
export const CardViewStyle =
  <GlobalStyles
    styles={(theme) => ({
      body: {
        // todo(nc): configure secondary light/dark mode background colors
        background: theme.palette.mode === 'dark' ? 'rgb(30, 30, 30)' : 'rgb(231, 235, 240)',
      }
    })}
  />


type Props = {
  noPad?: boolean
  children: ReactElement | ReactElement[]
} & CardProps

export const Card = (props: Props) => {
  const {children, noPad, ...rest} = props

  return (
    <MuiCard sx={{padding: noPad ? 0 : '16px 16px 20px 16px'}} {...rest}>
      {children}
    </MuiCard>
  )
}
