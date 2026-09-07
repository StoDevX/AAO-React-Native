import {dump} from 'js-yaml'
import type {Sense, WordType} from '../types'
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
	url.searchParams.append('labels[]', 'data/dictionary')
	url.searchParams.append('title', `Dictionary update for ${title}`)
	url.searchParams.append('body', makeMarkdownBody(before, after))
	return url.toString()
}

export function stringifyDictionaryEntry(entry: WordType): string {
	// let js-yaml handle dumping the scalars, just in case
	let head = dump(
		{
			word: entry.word,
			...(entry.pronunciation ? {pronunciation: entry.pronunciation} : {}),
			...(entry.partOfSpeech ? {partOfSpeech: entry.partOfSpeech} : {}),
		},
		{flowLevel: 4},
	)

	if (entry.senses) {
		return `${head}${stringifySenses(entry.senses)}`
	}

	if (entry.definition === undefined) {
		return head
	}

	return `${head}definition: |
${wrap(2, 80)(entry.definition)}
`
}

/** Dumps senses as YAML block scalars under a list item, indented to match the `- ` that opens it. */
function stringifySenses(senses: Sense[]): string {
	// Senses nest, so hand-rolled indentation stops being trustworthy past the
	// first level. js-yaml already knows how deep it is; the width keeps the
	// result readable in an email rather than one line per citation.
	return dump({senses}, {lineWidth: 80, noRefs: true})
}
