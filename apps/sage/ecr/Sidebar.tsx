import styled from 'styled-components'
import { NavLink } from 'react-router-dom'


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
          return <Divider key={`divider-${index}`} />
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

const Root = styled.div`
  padding-top: 18px;
  border-right: 1px solid #f1f1f1;
  background: #f8f8f8;
  max-width: 75px;
`

const Divider = styled.div`
  height: 1px;
  background: #ddd;
  margin: 10px 0;
`

const primaryColor = 'rgb(28, 140, 201)'


const Item = styled(NavLink)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 10px;
  width: 100%;
  color: #444;
  font-size: .9em;
  border-right: 3px solid #f5f5f5;

  svg {
    font-size: 2.5em;
  }

  :hover{
    text-decoration: none;
  }

  :hover:not(.active) {
    color: #000;
  }

  &.active {
    border-right: 3px solid ${primaryColor};
    border-top: 1px solid #eee;
    border-bottom: 1px solid #eee;
    margin-top: -1px;
    margin-bottom: -1px;
    background: rgb(255, 255, 255);
    font-weight: 800;
  }

  &.active .MuiSvgIcon-root {
    color: ${primaryColor};
  }
`

