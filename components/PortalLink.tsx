import { Link } from 'react-router-dom'
import config from '/config'


type Props = {
  to?: string
  href?: string
  children: React.ReactNode
  target?: string
  rel?: string
}


export default function PortalLink(props: Props) {
  const {children, target, rel} = props
  const to = props.to || props.href

  const isPortal = window.location.origin == config.portal

  if (isPortal)
    return <Link to={to}>{children}</Link>
  else
    return (
      <a href={`${config.portal}${to}`}
        {...(target ? {target} : {})}
        {...(rel ? {rel} : {})}
      >
        {children}
      </a>
    )
}

