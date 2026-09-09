import {dump} from 'js-yaml'
import type {BuildingType} from '../types'
import type {Campus} from '../query'
import {sendEmail} from '../../../components/send-email'
import {GH_NEW_ISSUE_URL, SUPPORT_EMAIL} from '../../../lib/constants'

/**
 * The name a report should carry for `campus`. Five venue names (Bookstore,
 * Post Office, Business Office, Financial Aid, Registrar) exist on both
 * campuses, so a subject or issue title naming only the building is
 * ambiguous without this.
 */
function campusLabel(campus: Campus): string {
	return campus === 'carleton' ? 'Carleton' : 'St. Olaf'
}

export function submitReport(
	current: BuildingType,
	suggestion: BuildingType,
	campus: Campus,
): void {
	// calling trim() on these to remove the trailing newlines
	let before = stringifyBuilding(current).trim()
	let after = stringifyBuilding(suggestion).trim()

	let body = makeEmailBody(before, after, current.name, campus)

	return sendEmail({
		to: [SUPPORT_EMAIL],
		subject: `[building] Suggestion for ${current.name} (${campusLabel(campus)})`,
		body,
	})
}

function makeEmailBody(before: string, after: string, title: string, campus: Campus): string {
	return `
Hi! Thanks for letting us know about a schedule change.

Please do not change anything below this line.

------------

Project maintainers: ${makeIssueLink(before, after, title, campus)}

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

function makeIssueLink(before: string, after: string, title: string, campus: Campus): string {
	let url = new URL(GH_NEW_ISSUE_URL)
	// `data/hours` is the label for `data/building-hours/*.yaml`, which is
	// St. Olaf-only -- Carleton has no YAML of its own to route this label
	// to, so a Carleton report still files here, named unambiguously instead.
	url.searchParams.append('labels[]', 'data/hours')
	url.searchParams.append('title', `Building hours update for ${title} (${campusLabel(campus)})`)
	url.searchParams.append('body', makeMarkdownBody(before, after))
	return url.toString()
}

function stringifyBuilding(building: BuildingType): string {
	let res = ''
	let prev = null
	let data = dump(building, {flowLevel: 4}).split('\n')
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
