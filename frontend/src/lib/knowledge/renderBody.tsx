import type { ReactNode } from 'react'

/** Renders canonical KB text, turning markdown links into anchors without changing wording. */
export function renderKnowledgeBody(body: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const pattern = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  while ((match = pattern.exec(body)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(body.slice(lastIndex, match.index))
    }
    nodes.push(
      <a
        key={`kb-link-${key++}`}
        href={match[2]}
        target="_blank"
        rel="noopener noreferrer"
      >
        {match[1]}
      </a>,
    )
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < body.length) {
    nodes.push(body.slice(lastIndex))
  }

  return nodes
}
