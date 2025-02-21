import  { useState, useRef, ReactNode } from 'react'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
`

const Sidebar = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: #f4f4f4;
  border-right: 1px solid #ddd;
  width: ${(props) => props.width}px;
  overflow-y: hidden;
  padding: 1rem;
`

const Resizer = styled.div`
  width: 3px;
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
