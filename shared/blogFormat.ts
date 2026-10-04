import type { BlogBlock } from './types.ts'

/*
 * Blog bodies are stored as structured blocks. In the admin editor they are
 * written as plain text using a tiny markup:
 *
 *   ## Heading
 *   > Pull quote
 *   - List item
 *   Anything else is a paragraph. Separate blocks with a blank line.
 */

export function blocksToText(blocks: BlogBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.type) {
        case 'heading':
          return `## ${b.text}`
        case 'quote':
          return `> ${b.text}`
        case 'list':
          return b.items.map((i) => `- ${i}`).join('\n')
        default:
          return b.text
      }
    })
    .join('\n\n')
}

export function textToBlocks(text: string): BlogBlock[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): BlogBlock => {
      const lines = chunk.split('\n').map((l) => l.trim())
      if (lines.every((l) => l.startsWith('- '))) return { type: 'list', items: lines.map((l) => l.slice(2).trim()) }
      if (chunk.startsWith('## ')) return { type: 'heading', text: chunk.slice(3).replace(/\s*\n\s*/g, ' ').trim() }
      if (chunk.startsWith('> ')) return { type: 'quote', text: lines.map((l) => l.replace(/^>\s?/, '')).join(' ').trim() }
      return { type: 'paragraph', text: lines.join(' ') }
    })
}

export function countWords(blocks: BlogBlock[]): number {
  return blocksToText(blocks).split(/\s+/).filter(Boolean).length
}
