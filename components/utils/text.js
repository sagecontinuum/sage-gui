import React from 'react'


export default function highlightText(text, query) {
  if (!text) return ''

  const parts = String(text).split(new RegExp(`(${query})`, 'gi'))
  return (
    <span>
      { parts.map((part, i) =>
        <span
          key={i}
          style={part.toLowerCase() === query.toLowerCase() ?
            { fontWeight: '800', color: '#2684ff' } :
            {}
          }>
          { part }
        </span>
      )
      }
    </span>
  )
}