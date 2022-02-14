import styled from 'styled-components'

import GitIcon from 'url:../../../assets/git.svg'
import LinkIcon from 'url:../../../assets/link.svg'
import Chip from '@mui/material/Chip'

import * as ECR from '~/components/apis/ecr'

const urlShortner = (url) =>
  `${url.slice(0, 40).replace('https://', '')}...`



const metaItem = (data, label) => {
  const key = label.toLowerCase()

  return (
    data[key]?.length ?
      <div>
        <h4>{label}</h4>
        <p>{data[key]}</p>
      </div> :
      <div>
        <h4>{label}</h4>
        <p className="muted not-found">None submitted</p>
      </div>
  )
}


// todo(nc): support more badges
const getLicense = license => {
  if (!license)
    return <p className="muted not-found">None submitted</p>

  const text = license.toLowerCase()
  let img, a
  if (text.includes('mit'))
    [img, a] = [`License-MIT-yellow.svg`, 'licenses/MIT']
  else if (text.includes('bsd') && text.includes('3'))
    [img, a] = [`License-BSD%203--Clause-blue.svg`, 'licenses/BSD-3-Clause']
  else if (text.includes('apache') && text.includes('2'))
    [img, a] = [`License-Apache%202.0-yellowgreen.svg`, 'licenses/Apache-2.0']
  else if (text.includes('gnu') && text.includes('3'))
    [img, a] = [`License-GPLv3-blue.svg`, 'licenses/gpl-3.0']

  if (a) {
    return (
      <p>
        <a href={`https://opensource.org/${a}`}>
          <img src={`https://img.shields.io/badge/${img}`} alt={license}/>
        </a>
      </p>
    )
  }

  return <p>{license}</p>
}




type Props = {
  data: ECR.AppMeta
}

export default function AppMeta(props: Props) {
  const {data} = props

  return (
    <Root>
      {data.images && <SciImage src={`${ECR.url}/meta-files/${data.images[0]}`} />}

      <h4>Repository</h4>
      <p>
        <a href={data?.source.url} target="_blank" rel="noreferrer" className="flex items-center">
          <img src={GitIcon} className="icon" /> {' '}
          {urlShortner(data?.source.url.slice(0, 40))}
        </a>
      </p>

      {data.homepage &&
      <>
        <h4>Homepage</h4>
        <p>
          <a href={data.homepage} className="flex items-center">
            <img src={LinkIcon} width="15" className="icon" /> {' '}
            {urlShortner(data.homepage)}
          </a>
        </p>
      </>
      }

      {data?.authors &&
      <>
        <h4>Authors</h4>
        <ul>
          {data?.authors.split(',').map(auth =>
            <li key={auth}>{auth.split('<')[0]}</li>
          )}
        </ul>
      </>
      }

      {data.keywords &&
      <>
        <h4>Keywords</h4>
        <Keywords>
          {data?.keywords.split(',').map(keyword =>
            <Chip key={keyword} label={keyword} variant="outlined" size="small"/>
          )}
        </Keywords>
      </>
      }

      <h4>License</h4>
      {getLicense(data.license)}

      {metaItem(data, 'Funding')}
      {metaItem(data, 'Collaborators')}
    </Root>
  )
}

const Root = styled.div`
  margin: 0 0 0 4em;
  min-width: 300px;
  max-width: 300px;

  h4 {
    opacity: 0.6;
    margin-bottom: 0.5em;
  }

  ul {
    list-style: none;
    padding: 0;
  }

  p, ul {
    margin: .5em 2px 1.5em 4px;
    font-weight: 600;
    .icon {
      margin-right: .3em;
    }
  }

  .not-found {
    font-weight: 400;
  }

  .MuiChip-root { font-weight: 500; }
`

const Keywords = styled.div`
  margin: 10px 0;

  div {
    margin: 2px;
  }
`

const SciImage = styled.img`
  margin-top: 1em;
  width: 100%;
`

