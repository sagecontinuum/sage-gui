import  { useState, useRef, ReactNode } from 'react'
import { styled } from '@mui/material'
import { SxProps, Theme } from '@mui/material'

const Container = styled('div')`
  display: flex;
`

const Sidebar = styled('div')<{width: number}>`
  position: relative;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#f8f8f8'};
  border-right: 1px solid ${props => props.theme.palette.divider};
  width: ${(props) => props.width}px;
  overflow-y: hidden;
  padding: 1rem;
  z-index: 9;

  .MuiPaper-root {
    box-shadow: rgb(229 229 229) 2px 3px 9px 1px;
  }
`

const Resizer = styled('div')`
  width: 2px;
  cursor: col-resize;
  background-color: #ccc;
`

type Props = {
  children: ReactNode,
  sx?: SxProps<Theme>
  width?: number
}

const ResizableSidebar = (props: Props) => {
  const {children, sx} = props

  const [width, setWidth] = useState(props.width || 275)
  const resizerRef = useRef<HTMLDivElement | null>(null)
  const sidebarRef = useRef<HTMLDivElement | null>(null)

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const onMouseMove = (e: MouseEvent) => {
    if (!sidebarRef.current) return
    const newWidth = e.clientX - sidebarRef.current.getBoundingClientRect().left
    setWidth(newWidth)
  }

  const onMouseUp = () => {
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  return (
    <Container>
      <Sidebar ref={sidebarRef} width={width} sx={sx}>
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {children}
        </div>
      </Sidebar>
      <Resizer ref={resizerRef} onMouseDown={onMouseDown} />
    </Container>
  )
}

export default ResizableSidebar
