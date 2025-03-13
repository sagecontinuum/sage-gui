import  { useState, useRef, ReactNode } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
`

const Sidebar = styled.div<{width: number}>`
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: #fafafa;
  border-right: 1px solid #ddd;
  width: ${(props) => props.width}px;
  overflow-y: hidden;
  padding: 1rem;
  z-index: 9;

  .MuiPaper-root {
    box-shadow: rgb(229 229 229) 2px 3px 9px 1px;
  }
`

const Resizer = styled.div`
  width: 2px;
  cursor: col-resize;
  background-color: #ccc;
`

type Props = {
  children: ReactNode
}

const ResizableSidebar = (props: Props) => {
  const {children} = props

  const [width, setWidth] = useState(250)
  const resizerRef = useRef(null)
  const sidebarRef = useRef(null)

  const onMouseDown = (e) => {
    e.preventDefault()
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const onMouseMove = (e) => {
    const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left
    setWidth(newWidth)
  }

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  return (
    <Container>
      <Sidebar ref={sidebarRef} width={width}>
        <div style={{ flexGrow: 1 }}>{children}</div>
      </Sidebar>
      <Resizer ref={resizerRef} onMouseDown={onMouseDown} />
    </Container>
  )
}

export default ResizableSidebar
