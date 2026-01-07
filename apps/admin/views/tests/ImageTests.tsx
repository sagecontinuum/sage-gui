import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'

import * as BK from '/components/apis/beekeeper'
import RecentImages from '/components/views/RecentImages'
import { Card, CardViewStyle } from '/components/layout/Layout'


const ITEMS_INITIALLY = 10
const ITEMS_PER_PAGE = 5


type RecentImgsProps = {
  vsns?: BK.VSN[]
}

function RecentImgs(props: RecentImgsProps) {
  const {vsns} = props

  const [nodes, setNodes] = useState<BK.Node[]>()
  const [project] = useState('sage')

  const loader = useRef(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    BK.getNodes()
      .then(data => {
        const node_vsns = data
          .filter(o => o.phase == 'Deployed')
          .filter(o => vsns?.length ? vsns.includes(o.vsn) : true)
          .reverse()
        setNodes(node_vsns)
      })
  }, [project, vsns])


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
      {nodes?.slice(0, getInfiniteEnd(page)).map(node => {
        const {vsn} = node
        return (
          <Card key={vsn} className="card">
            <h3><Link to={`/node/${vsn}`}>{vsn}</Link></h3>
            <Imgs>
              <RecentImages
                vsn={vsn}
                cameras={node.sensors.filter(o => o.capabilities.includes('camera')).map(o => o.name)}
                horizontal
              />
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
      {CardViewStyle}
      <h1>Latest Sample Images from Deployed Nodes</h1>
      <br/>
      <RecentImgs />
    </Root>
  )
}


const Root = styled.div`
  margin: 20px;

  h3 { margin-top: 0; }

  .card { margin: 0 0 1rem 0; }

  canvas {
    height: 800px;
  }
`

const Imgs = styled.div`
  img {
    max-height: 325px;
  }
`