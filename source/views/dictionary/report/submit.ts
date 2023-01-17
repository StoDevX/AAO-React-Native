import jsYaml from 'js-yaml'
import type {WordType} from '../types'
import {sendEmail} from '../../../components/send-email'
import {GH_NEW_ISSUE_URL, SUPPORT_EMAIL} from '../../../lib/constants'
import wrap from 'wordwrap'

export function submitReport(current: WordType, suggestion: WordType): void {
	let before = stringifyDictionaryEntry(current)
	let after = stringifyDictionaryEntry(suggestion)

	let body = makeEmailBody(before, after, current.word)

	return sendEmail({
		to: [SUPPORT_EMAIL],
		subject: `[dictionary] Suggestion for ${current.word}`,
		body,
	})
}

function makeEmailBody(before: string, after: string, title: string): string {
	return `
Hi! Thanks for letting us know about a dictionary change.

Please do not change anything below this line.

------------

Project maintainers: ${makeIssueLink(before, after, title)}

${makeHtmlBody(before, after)}
`
}

const makeMarkdownBody = (before: string, after: string) =>
	`
## Before:

\`\`\`yaml
${before}
\`\`\`

## After:

\`\`\`yaml
${after}
\`\`\`
`

const makeHtmlBody = (before: string, after: string) => `
<p>Before:</p>
<pre><code>${before}</code></pre>

<p>After:</p>
<pre><code>${after}</code></pre>
`

function makeIssueLink(before: string, after: string, title: string): string {
	let url = new URL(GH_NEW_ISSUE_URL)
	url.searchParams.set('labels[]', 'data/dictionary')
	url.searchParams.set('title', `Dictionary update for ${title}`)
	url.searchParams.set('body', makeMarkdownBody(before, after))
	return url.toString()
}

export function stringifyDictionaryEntry(entry: WordType): string {
	// let js-yaml handle dumping the word, just in case
	let initialData = jsYaml.dump({word: entry.word}, {flowLevel: 4})

	let definition = `definition: |
${wrap(2, 80)(entry.definition)}
`

	return `${initialData}${definition}`
}
