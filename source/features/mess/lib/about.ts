import {getElementsByTagName, isTag, parseHtml, textContent, type AnyNode} from '@frogpond/html-lib'
import {z} from 'zod'
import type {AboutSection} from '../types'

const PagesSchema = z.array(z.object({content: z.object({rendered: z.string()})}))

const MAILTO = 'mailto:'

/** A node's text on one line, with runs of spaces, line breaks and no-break spaces made one space. */
function textOf(node: AnyNode): string {
	return textContent(node).replaceAll(/\s+/gu, ' ').trim()
}

/**
 * The paper's About page as sections, one per heading. A paragraph with a `mailto:` link is a
 * contact, named by the paragraph's other text; any other paragraph with words is prose. A
 * heading's trailing ellipsis, as in `By section…`, is dropped.
 */
export function parseAboutPage(body: unknown): AboutSection[] {
	let [page] = PagesSchema.parse(body)
	if (!page) throw new Error('The Olaf Messenger has no About page')

	let sections: AboutSection[] = []
	for (let node of parseHtml(page.content.rendered).children) {
		if (!isTag(node)) continue
		if (node.name === 'h2') {
			let title = textOf(node).replace(/(?:…|\.\.\.)$/u, '')
			sections.push({title, contacts: [], paragraphs: []})
			continue
		}
		let section = sections.at(-1)
		if (!section || node.name !== 'p') continue

		let link = getElementsByTagName('a', node).find((a) => a.attribs.href?.startsWith(MAILTO))
		if (link) {
			let email = link.attribs.href.slice(MAILTO.length).split('?')[0] ?? ''
			let role = textOf(node).replace(textOf(link), '').trim()
			section.contacts.push({role, email})
			continue
		}
		let text = textOf(node)
		if (text) section.paragraphs.push(text)
	}

	if (sections.length === 0) throw new Error('The Olaf Messenger’s About page has no sections')
	return sections
}
