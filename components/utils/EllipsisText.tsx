import { type CSSProperties } from 'react'

type EllipsisTextProps = {
  children: React.ReactNode
  title?: string
  maxWidth?: CSSProperties['maxWidth']
}

export default function EllipsisText({
  children,
  title,
  maxWidth = '100%'
}: EllipsisTextProps) {
  return (
    <span
      title={title}
      style={{
        display: 'block',
        flex: '1 1 auto',
        width: 0,
        minWidth: 0,
        maxWidth,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}
    >
      {children}
    </span>
  )
}