import {parseDocument} from 'htmlparser2'
import {isText, isTag} from 'domhandler'
import type {ChildNode} from 'domhandler'

function walkNodes(nodes: ChildNode[], listContext?: 'ul' | 'ol'): string {
	let result = ''
	let olCounter = 0

	for (const node of nodes) {
		if (isText(node)) {
			// Skip whitespace-only text nodes (insignificant HTML formatting whitespace)
			if (node.data.trim() !== '') result += node.data
			continue
		}

		if (!isTag(node)) continue

		const tag = node.name.toLowerCase()
		const children = node.children

		switch (tag) {
			case 'p':
				result += walkNodes(children).trim() + '\n\n'
				break
			case 'br':
				result += '\n'
				break
			case 'ul':
				result += walkNodes(children, 'ul')
				break
			case 'ol':
				result += walkNodes(children, 'ol')
				break
			case 'li': {
				olCounter += 1
				const content = walkNodes(children).trim()
				if (listContext === 'ol') {
					result += `${olCounter}. ${content}\n`
				} else {
					result += `• ${content}\n`
				}
				break
			}
			case 'blockquote': {
				const inner = walkNodes(children).trim()
				result +=
					inner
						.split('\n')
						.map((line) => `  ${line}`)
						.join('\n') + '\n'
				break
			}
			default:
				result += walkNodes(children)
		}
	}

	return result
}

export function htmlToFormattedText(html: string): string {
	const doc = parseDocument(html, {decodeEntities: true})
	const raw = walkNodes(doc.children)
	return raw.replace(/\n{3,}/gu, '\n\n').replace(/^\n+|\n+$/gu, '')
}
