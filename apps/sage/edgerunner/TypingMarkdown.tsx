import { useEffect, useMemo, useState } from 'react'
import { styled } from '@mui/material/styles'
import { marked } from 'marked'

/**
 * Tuning reference for typing animation props:
 *
 *  Fast but smooth      typingIntervalMs: 28,  fadeInDurationMs: 140
 *  Very fast, readable  typingIntervalMs: 20,  fadeInDurationMs: 120
 *  Balanced (default)   typingIntervalMs: 45,  fadeInDurationMs: 160
 *
 * Rule of thumb: fadeInDurationMs ≈ 3–5× typingIntervalMs for smooth overlap.
 */

type Props = {
  markdownOutput: string
  enableTyping?: boolean
  typingIntervalMs?: number
  fadeInDurationMs?: number
}

const isBlankLine = (line: string): boolean => /^\s*$/.test(line)
const isHeaderLine = (line: string): boolean => /^\s{0,3}#{1,6}\s+/.test(line)
const isListItemLine = (line: string): boolean => /^\s*([-*+]\s+|\d+\.\s+)/.test(line)
const isQuoteLine = (line: string): boolean => /^\s*>\s?/.test(line)
const isFenceLine = (line: string): boolean => /^\s*```/.test(line)

const getIndent = (line: string): number => {
  const match = line.match(/^\s*/)
  return match ? match[0].length : 0
}

const chunkMarkdown = (markdown: string): string[] => {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const chunks: string[] = []

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    if (isBlankLine(line)) {
      i += 1
      continue
    }

    if (isFenceLine(line)) {
      const start = i
      i += 1
      while (i < lines.length) {
        if (isFenceLine(lines[i])) {
          i += 1
          break
        }
        i += 1
      }
      chunks.push(lines.slice(start, i).join('\n'))
      continue
    }

    if (isHeaderLine(line)) {
      chunks.push(line)
      i += 1
      continue
    }

    if (isListItemLine(line)) {
      const start = i
      const baseIndent = getIndent(line)
      i += 1

      while (i < lines.length) {
        const current = lines[i]
        if (isBlankLine(current)) {
          break
        }

        if (isListItemLine(current) && getIndent(current) <= baseIndent) {
          break
        }

        i += 1
      }

      chunks.push(lines.slice(start, i).join('\n'))
      continue
    }

    if (isQuoteLine(line)) {
      const start = i
      i += 1
      while (i < lines.length && isQuoteLine(lines[i])) {
        i += 1
      }
      chunks.push(lines.slice(start, i).join('\n'))
      continue
    }

    const start = i
    i += 1
    while (i < lines.length) {
      const current = lines[i]
      if (
        isBlankLine(current) ||
        isHeaderLine(current) ||
        isListItemLine(current) ||
        isQuoteLine(current) ||
        isFenceLine(current)
      ) {
        break
      }
      i += 1
    }
    chunks.push(lines.slice(start, i).join('\n'))
  }

  return chunks
}

export default function TypingMarkdown(props: Props) {
  const {
    markdownOutput,
    enableTyping,
    typingIntervalMs = 80,
    fadeInDurationMs = 180
  } = props

  const intervalMs = Math.max(10, typingIntervalMs)
  const fadeDurationMs = Math.max(60, fadeInDurationMs)

  const markdownChunks = useMemo(
    () => chunkMarkdown(markdownOutput),
    [markdownOutput]
  )

  const chunkTokens = useMemo(
    () => markdownChunks.map((chunk) => chunk.split(/(\s+)/).filter((token) => token.length > 0)),
    [markdownChunks]
  )

  const chunkWordCounts = useMemo(
    () => chunkTokens.map((tokens) => tokens.filter((token) => !/^\s+$/.test(token)).length),
    [chunkTokens]
  )

  const fullHtml = useMemo(() => marked(markdownOutput), [markdownOutput])
  const chunkHtml = useMemo(() => markdownChunks.map((chunk) => marked(chunk)), [markdownChunks])

  const [typingProgress, setTypingProgress] = useState<{chunkIndex: number, wordCount: number}>({
    chunkIndex: 0,
    wordCount: 0
  })

  useEffect(() => {
    if (!enableTyping) {
      setTypingProgress({
        chunkIndex: markdownChunks.length,
        wordCount: 0
      })
      return
    }

    setTypingProgress({chunkIndex: 0, wordCount: 0})

    if (!markdownChunks.length) {
      return
    }

    const interval = window.setInterval(() => {
      setTypingProgress((prev) => {
        if (prev.chunkIndex >= markdownChunks.length) {
          window.clearInterval(interval)
          return prev
        }

        const currentChunkWordCount = chunkWordCounts[prev.chunkIndex] || 0

        if (!currentChunkWordCount) {
          const nextChunkIndex = prev.chunkIndex + 1
          if (nextChunkIndex >= markdownChunks.length) {
            window.clearInterval(interval)
          }
          return {chunkIndex: nextChunkIndex, wordCount: 0}
        }

        const nextWordCount = prev.wordCount + 1
        if (nextWordCount >= currentChunkWordCount) {
          const nextChunkIndex = prev.chunkIndex + 1
          if (nextChunkIndex >= markdownChunks.length) {
            window.clearInterval(interval)
          }
          return {chunkIndex: nextChunkIndex, wordCount: 0}
        }

        return {chunkIndex: prev.chunkIndex, wordCount: nextWordCount}
      })
    }, intervalMs)

    return () => {
      window.clearInterval(interval)
    }
  }, [
    enableTyping,
    markdownOutput,
    markdownChunks.length,
    chunkWordCounts,
    intervalMs
  ])

  const isComplete = typingProgress.chunkIndex >= markdownChunks.length

  if (isComplete || !enableTyping) {
    return (
      <div
        className="font-medium no-margin"
        dangerouslySetInnerHTML={{__html: fullHtml}}
      />
    )
  }

  const completedChunkHtml = chunkHtml.slice(0, typingProgress.chunkIndex)
  const activeTokens = chunkTokens[typingProgress.chunkIndex] || []

  const activeWordTokenIndexes = activeTokens.reduce<number[]>((acc, token, idx) => {
    if (!/^\s+$/.test(token)) {
      acc.push(idx)
    }
    return acc
  }, [])

  const lastVisibleTokenIndex = typingProgress.wordCount > 0
    ? activeWordTokenIndexes[Math.min(typingProgress.wordCount - 1, activeWordTokenIndexes.length - 1)]
    : -1

  const visibleActiveTokens = lastVisibleTokenIndex >= 0
    ? activeTokens.slice(0, lastVisibleTokenIndex + 1)
    : []

  return (
    <TypingText
      className="font-medium no-margin"
      aria-live="polite"
      fadeInDurationMs={fadeDurationMs}
    >
      {completedChunkHtml.map((html, idx) => {
        return (
          <div
            key={`chunk-${idx}`}
            className="rendered-chunk"
            dangerouslySetInnerHTML={{__html: html}}
          />
        )
      })}

      {typingProgress.chunkIndex < markdownChunks.length && (
        <div className="typing-active-chunk">
          {visibleActiveTokens.map((token, idx) => {
            if (/^\s+$/.test(token)) {
              return token
            }

            return (
              <span key={`active-word-${typingProgress.chunkIndex}-${idx}`} className="typing-word">
                {token}
              </span>
            )
          })}
        </div>
      )}
    </TypingText>
  )
}

const TypingText = styled('div')<{fadeInDurationMs: number}>`
  .rendered-chunk {
    opacity: 1;
  }

  .typing-active-chunk {
    white-space: pre-wrap;
    word-break: break-word;
  }

  .typing-word {
    display: inline-block;
    opacity: 0;
    animation: fade-word-in ${(props) => props.fadeInDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
    will-change: opacity, transform;
  }

  @keyframes fade-word-in {
    from {
      opacity: 0;
      transform: translateY(1px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`