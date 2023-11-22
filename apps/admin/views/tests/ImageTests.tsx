import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import * as BK from '/components/apis/beekeeper'
import RecentImages from '/components/views/RecentImages'
import { Card, CardViewStyle } from '/components/layout/Layout'


const ITEMS_INITIALLY = 10
const ITEMS_PER_PAGE = 5


function RecentImgs() {
  const [nodes, setNodes] = useState<BK.VSN[]>()
  const [project] = useState('sage')

  const loader = useRef(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    BK.getRawManifests()
      .then(data => {
        const vsns = data
          .filter(o => o.phase == 'Deployed')
          .map(o => o.vsn)
          .reverse()
        setNodes(vsns)
      })
  }, [project])


  const getInfiniteEnd = (page: number) =>
    page == 1 ? ITEMS_INITIALLY : page * ITEMS_PER_PAGE


  const handleObserver = useCallback((entries) => {
    const target = entries[0]
    if (!target.isIntersecting) return

    setTimeout(() => {
      setPage(prev => prev + 1)
    })
  }, [])


  useEffect(() => {
    const option = {
      root: null,
      rootMargin: '100px',
      threshold: 0
    }
    const observer = new IntersectionObserver(handleObserver, option)
    if (loader.current) observer.observe(loader.current)
  }, [handleObserver])


  return (
    <div>
      {nodes?.slice(0, getInfiniteEnd(page)).map(vsn => {
        return (
          <Card key={vsn} className="card">
            <h3><Link to={`/node/${vsn}`}>{vsn}</Link></h3>
            <Imgs>
              <RecentImages vsn={vsn} horizontal />
            </Imgs>
          </Card>
        )
      })}
      <div ref={loader} />
    </div>
  )
}

export default function ImageTests() {
  return (
    <Root>
      <CardViewStyle />
      <h1>Latest Sample Images from Deployed Nodes</h1>
      <RecentImgs />
    </Root>
  )
}


const Root = styled.div`
  margin: 20px;

  h3 { margin-top: 0; }

  .card { margin: 0 0 1rem 0; }
`

const Imgs = styled.div`
  img {
    max-height: 325px;
  }
`