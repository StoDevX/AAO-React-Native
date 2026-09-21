import {dump} from 'js-yaml'
import type {BuildingType} from '../types'
import type {Campus} from '../types'
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
	note: string,
): void {
	// calling trim() on these to remove the trailing newlines
	let before = stringifyBuilding(current).trim()
	let after = stringifyBuilding(suggestion).trim()

	let body = makeEmailBody(before, after, current.name, campus, note)

	return sendEmail({
		to: [SUPPORT_EMAIL],
		subject: `[building] Suggestion for ${current.name} (${campusLabel(campus)})`,
		body,
	})
}

function makeEmailBody(
	before: string,
	after: string,
	title: string,
	campus: Campus,
	note: string,
): string {
	return `
Hi! Thanks for letting us know about a change.
${note ? `\n${note}\n` : ''}
Please do not change anything below this line.

------------

Project maintainers: ${makeIssueLink(before, after, title, campus, note)}

${makeHtmlBody(before, after)}
`
}

const makeMarkdownBody = (before: string, after: string, note: string) =>
	`
${note ? `${note}\n\n` : ''}## Before:

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

function makeIssueLink(
	before: string,
	after: string,
	title: string,
	campus: Campus,
	note: string,
): string {
	let url = new URL(GH_NEW_ISSUE_URL)
	// `data/hours` is the label for `data/building-hours/*.yaml`, which is
	// St. Olaf-only -- Carleton has no YAML of its own to route this label
	// to, so a Carleton report still files here, named unambiguously instead.
	url.searchParams.append('labels[]', 'data/hours')
	url.searchParams.append('title', `Building update for ${title} (${campusLabel(campus)})`)
	url.searchParams.append('body', makeMarkdownBody(before, after, note))
	return url.toString()
}

function stringifyBuilding(building: BuildingType): string {
	let toShow = withoutBlankLinks(building)
	let res = ''
	let prev = null
	let data = dump(toShow, {flowLevel: 4}).split('\n')
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

/**
 * A link with neither a title nor a url carries nothing for a maintainer to
 * act on, so it is dropped before the building reaches the YAML dump. A link
 * with just one of the two is a real, if incomplete, report and stays.
 */
function withoutBlankLinks(building: BuildingType): BuildingType {
	if (!building.links) {
		return building
	}

	let links = building.links.filter((link) => link.title !== '' || link.url !== '')
	if (links.length === building.links.length) {
		return building
	}

	if (links.length === 0) {
		let {links: _links, ...rest} = building
		return rest
	}

	return {...building, links}
}
