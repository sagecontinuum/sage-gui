import styled from 'styled-components'
import { Tabs, Tab } from './Tabs'
import { Link, useLocation } from 'react-router-dom'

type Tab = {
  label: string
  icon: JSX.Element
  to: string
}

type Props = {
  defaultValue: string
  ariaLabel: string
  tabs: Tab[]
}

export default function Tabber(props: Props) {
  const {defaultValue, ariaLabel, tabs} = props

  const path = useLocation().pathname

  return (
    <Root>
      <Tabs
        value={path || defaultValue}
        aria-label={ariaLabel}
      >
        {tabs.map(obj => {
          const {label, icon, to} = obj
          return (
            <Tab
              key={label}
              label={
                <div className="flex items-center">
                  {icon}&nbsp;{label}
                </div>
              }
              component={Link}
              value={to}
              to={to}
            />
          )
        })}
      </Tabs>
    </Root>
  )
}

const Root = styled.div`

`
