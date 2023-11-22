import { Link } from 'react-router-dom'
import styled from 'styled-components'

type BreadcrumbProps = {
  path: string
  onNavigate?: (evt: React.MouseEvent<HTMLElement>, path: string) => void
}

export default function Breadcrumbs(props: BreadcrumbProps) {
  const {path, onNavigate} = props

  const parts = path.split('/')
  parts.shift()
  const topLevel = decodeURIComponent(parts[0])
  const currentLevel = parts.length - 1


  return (
    <Root>
      {' / '}
      <Link
        to={`/${topLevel}`}
        onClick={(evt) => onNavigate(evt, `/${topLevel}`)}
      >
        {topLevel.split('@')[0]}
      </Link>
      {' / '}

      {parts.slice(1).map((name, i) => {
        const userPath = parts.slice(1, 2 + i).join('/')
        const fullPath = `/${topLevel}/${userPath}`
        const path = `/${fullPath}`

        return (
          <span key={i}>
            {i == currentLevel - 1 ?
              name :
              <>
                <Link
                  to={path}
                  onClick={(evt) => onNavigate(evt, fullPath)}
                >
                  {name}
                </Link>
                {' / '}
              </>
            }
          </span>
        )
      })
      }
    </Root>
  )
}


const Root = styled.div`
  background-color: #fff;
  font-size: 1.1em;
`
