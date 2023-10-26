import {sendEmail} from '../../../components/send-email'
import {GH_NEW_ISSUE_URL, SUPPORT_EMAIL} from '../../../lib/constants'
import type {BuildingType} from '../types'
import jsYaml from 'js-yaml'

export function submitReport(
	current: BuildingType,
	suggestion: BuildingType,
): void {
	// calling trim() on these to remove the trailing newlines
	let before = stringifyBuilding(current).trim()
	let after = stringifyBuilding(suggestion).trim()

	let body = makeEmailBody(before, after, current.name)

	return sendEmail({
		to: [SUPPORT_EMAIL],
		subject: `[building] Suggestion for ${current.name}`,
		body,
	})
}

function makeEmailBody(before: string, after: string, title: string): string {
	return `
Hi! Thanks for letting us know about a schedule change.

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
	url.searchParams.append('labels[]', 'data/hours')
	url.searchParams.append('title', `Building hours update for ${title}`)
	url.searchParams.append('body', makeMarkdownBody(before, after))
	return url.toString()
}

function stringifyBuilding(building: BuildingType): string {
	let res = ''
	let prev = null
	let data = jsYaml.dump(building, {flowLevel: 4}).split('\n')
	for (let line of data) {
		if (['schedule:', 'breakSchedule:'].includes(line)) {
			res += `\n\n${line}`
		} else if (line.startsWith('  - title:') && prev !== 'schedule:') {
			res += `\n\n${line}`
		} else {
			res += `\n${line}`
		}
		prev = line
	}
	return res
}
