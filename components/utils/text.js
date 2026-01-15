import React from 'react'


export default function highlightText(text, query) {
  if (!text) return ''

  // Escape special regex characters in the query
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = String(text).split(new RegExp(`(${escapedQuery})`, 'gi'))
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