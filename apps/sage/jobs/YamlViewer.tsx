import { useState } from 'react'
import { Link } from 'react-router-dom'
import { styled } from '@mui/material'
import { useColorScheme } from '@mui/material'
import { Highlight, themes } from 'prism-react-renderer'

import CopyBtn from '/components/utils/CopyBtn'

const MAX_LINES = 25

type Props = {
  code: string
  /** VSN strings (e.g. W001) */
  nodeSet: Set<string>
}

export default function YamlViewer({ code, nodeSet }: Props) {
  const { mode, systemMode } = useColorScheme()
  const isDark = (mode === 'system' ? systemMode : mode) === 'dark'
  const [expanded, setExpanded] = useState(false)

  const totalLines = code.split('\n').length
  const needsTruncation = totalLines > MAX_LINES

  return (
    <Root>
      <div className="copy-btn-wrap">
        <CopyBtn tooltip="Copy YAML" onClick={() => navigator.clipboard.writeText(code)} />
      </div>
      <Highlight
        code={code}
        language="yaml"
        theme={isDark ? themes.vsDark : themes.github}
      >
        {({ tokens, getLineProps, getTokenProps }) => (
          <code>
            {(expanded ? tokens : tokens.slice(0, MAX_LINES)).map((line, i) => {
              const fullText = line.map(t => t.content).join('')

              // check if this line is an `image:` value line
              const imageMatch = fullText.match(/^(\s*image:\s*)(.+?)\s*$/)
              if (imageMatch) {
                const imgValue = imageMatch[2].trim()
                const path = imgValue.replace('registry.sagecontinuum.org/', '').split(':')[0]
                const valueStart = fullText.indexOf(imgValue)
                const valueEnd = valueStart + imgValue.length

                // split tokens into before / inside link / after, handling tokens that
                // straddle a boundary by slicing their content at the boundary
                type Piece = { content: string; props: ReturnType<typeof getTokenProps> }
                let charPos = 0
                const before: Piece[] = [], inside: Piece[] = [], after: Piece[] = []
                for (const token of line) {
                  const props = getTokenProps({ token })
                  const tokenEnd = charPos + token.content.length
                  if (tokenEnd <= valueStart) {
                    before.push({ content: token.content, props })
                  } else if (charPos >= valueEnd) {
                    after.push({ content: token.content, props })
                  } else {
                    // token overlaps the value range — slice off any out-of-range prefix/suffix
                    const start = Math.max(charPos, valueStart)
                    const end = Math.min(tokenEnd, valueEnd)
                    if (charPos < valueStart) {
                      before.push({ content: token.content.slice(0, valueStart - charPos), props })
                    }
                    inside.push({ content: token.content.slice(start - charPos, end - charPos), props })
                    if (tokenEnd > valueEnd) {
                      after.push({ content: token.content.slice(valueEnd - charPos), props })
                    }
                  }
                  charPos = tokenEnd
                }

                return (
                  <div key={i} {...getLineProps({ line })}>
                    {before.map(({ content, props }, j) => <span key={j} {...props}>{content}</span>)}
                    <Link to={`/apps/app/${path}`}>
                      {inside.map(({ content, props }, j) => <span key={j} {...props}>{content}</span>)}
                    </Link>
                    {after.map(({ content, props }, j) => <span key={j} {...props}>{content}</span>)}
                  </div>
                )
              }

              // default: render tokens, linking VSNs per-token
              return (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, j) => {
                    const bare = token.content.replace(/^['"]|['"]$/g, '').trim()
                    if (bare && nodeSet.has(bare)) {
                      return (
                        <span key={j} {...getTokenProps({ token })}>
                          <Link to={`/nodes/${bare}`}>{token.content}</Link>
                        </span>
                      )
                    }
                    return <span key={j} {...getTokenProps({ token })} />
                  })}
                </div>
              )
            })}
          </code>
        )}
      </Highlight>
      {needsTruncation && (
        <ExpandBtn onClick={() => setExpanded(e => !e)}>
          {expanded
            ? 'Show less'
            : `▼ Show ${totalLines - MAX_LINES} more lines`
          }
        </ExpandBtn>
      )}
    </Root>
  )
}

const Root = styled('pre')`
  position: relative;
  margin: 0;
  padding: 1em 1em 0 1em;

  overflow-x: auto;
  font-size: 0.8rem;
  font-weight: 550;
  line-height: 1.5;
  background: ${({ theme }) => theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff'};
  border: 1px solid ${({ theme }) => theme.palette.divider};

  .copy-btn-wrap {
    position: absolute;
    top: 4px;
    right: 4px;
  }

  a {
    color: inherit;
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
    &:hover { text-decoration-thickness: 3px; }
  }
`

const ExpandBtn = styled('button')`
  display: block;
  width: 100%;
  padding: 0.4em 1em;
  border: none;
  border-top: 1px solid ${({ theme }) => theme.palette.divider};
  background: ${({ theme }) => theme.palette.mode === 'dark' ? '#2a2a2a' : '#f0f0f0'};
  color: ${({ theme }) => theme.palette.primary.main};
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;
  &:hover { background: ${({ theme }) => theme.palette.mode === 'dark' ? '#333' : '#e4e4e4'}; }
`
