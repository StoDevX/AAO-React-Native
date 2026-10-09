import {dump} from 'js-yaml'
import type {BuildingType} from '../types'
import {composeEmail} from '../../../components/send-email'
import {GH_NEW_ISSUE_URL} from '../../../lib/constants'

/** Who a report goes to, and how it names the campus. */
export type ReportCampus = {
	/**
	 * The campus's name in the subject and the issue title (`hours.reportLabel`):
	 * five venue names (Bookstore, Post Office, Business Office, Financial Aid,
	 * Registrar) exist on both campuses, so a title naming only the building is
	 * ambiguous.
	 */
	label: string
	/** The campus's support address (`branding.supportEmail`). */
	supportEmail: string
}

/** Mails a suggested change to a venue to its campus's support address. */
export function submitReport(
	current: BuildingType,
	suggestion: BuildingType,
	campus: ReportCampus,
	note: string,
	attachments: Array<string> = [],
): Promise<boolean> {
	// calling trim() on these to remove the trailing newlines
	let before = stringifyBuilding(current).trim()
	let after = stringifyBuilding(suggestion).trim()

	let body = makeEmailBody(before, after, current.name, campus.label, note)

	return composeEmail({
		to: [campus.supportEmail],
		subject: `[building] Suggestion for ${current.name} (${campus.label})`,
		body,
		attachments,
	})
}

function makeEmailBody(
	before: string,
	after: string,
	title: string,
	campusLabel: string,
	note: string,
): string {
	return `
Hi! Thanks for letting us know about a change.
${note ? `\n${note}\n` : ''}
Please do not change anything below this line.

------------

Project maintainers: ${makeIssueLink(before, after, title, campusLabel, note)}

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
	campusLabel: string,
	note: string,
): string {
	let url = new URL(GH_NEW_ISSUE_URL)
	// `data/hours` is the label for `data/building-hours/*.yaml`; a campus with
	// no YAML here still files under it, named unambiguously.
	url.searchParams.append('labels[]', 'data/hours')
	url.searchParams.append('title', `Building update for ${title} (${campusLabel})`)
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
