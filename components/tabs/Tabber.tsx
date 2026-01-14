import { Link, useLocation } from 'react-router-dom'

import { Tabs, Tab } from './Tabs'
import Divider from '@mui/material/Divider'


type Tab = {
  label: string
  icon: JSX.Element
  to: string
} | 'divider'

type Props = {
  defaultValue: string
  ariaLabel: string
  tabs: Tab[]
}

export default function Tabber(props: Props) {
  const {defaultValue, ariaLabel, tabs} = props

  const loc = useLocation()
  const path = loc.pathname + loc.search


  return (
    <>
      <Tabs
        value={path || defaultValue}
        aria-label={ariaLabel}
      >
        {tabs.map(obj => {
          if (obj == 'divider')
            return (
              <Divider
                key="divider"
                orientation="vertical"
                style={{ height: 30, alignSelf: 'center' }}
              />
            )

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
    </>
  )
}
