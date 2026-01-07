import { styled } from '@mui/material'
import { NavLink } from 'react-router-dom'
import { Divider } from '@mui/material'


export type NavItem = {
  to?: string
  icon?: React.ReactNode
  label?: string
  divider?: boolean
}

type Props = {
  items: NavItem[]
}

export default function Sidebar(props: Props) {
  const { items } = props

  return (
    <Root className="flex-nowrap">
      {items.map((item, index) => {
        if (item.divider) {
          return <Divider key={`divider-${index}`} sx={{borderWidth: 1}} />
        }
        return (
          <Item key={item.to} to={item.to!}>
            {item.icon}
            <div>{item.label}</div>
          </Item>
        )
      })}
    </Root>
  )
}

const Root = styled('div')`
  padding-top: 18px;
  border-right: 1px solid rgba(0, 0, 0, 0.12);
  background: ${({ theme }) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f8f8'};
  max-width: 75px;
`



const primaryColor = 'rgb(28, 140, 201)'


const Item = styled(NavLink)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 10px;
  width: 100%;
  color: ${({ theme }) => theme.palette.mode === 'dark' ? '#bbb' : '#444'};
  font-size: .9em;
  border-right: 3px solid ${({ theme }) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5'};

  svg {
    font-size: 2.5em;
  }

  :hover{
    text-decoration: none;
  }

  :hover:not(.active) {
    color: ${({ theme }) => theme.palette.mode === 'dark' ? '#fff' : '#000'};
  }

  &.active {
    border-right: 3px solid ${primaryColor};
    border-top: 1px solid ${({ theme }) => theme.palette.mode === 'dark' ? '#333' : '#eee'};
    border-bottom: 1px solid ${({ theme }) => theme.palette.mode === 'dark' ? '#333' : '#eee'};
    margin-top: -1px;
    margin-bottom: -1px;
    background: ${({ theme }) => theme.palette.mode === 'dark' ? '#2a2a2a' : 'rgb(255, 255, 255)'};
    font-weight: 800;
  }

  &.active .MuiSvgIcon-root {
    color: ${primaryColor};
  }
`

