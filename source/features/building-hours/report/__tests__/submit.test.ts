import {describe, expect, it, jest} from '@jest/globals'
import type {BuildingType} from '../../types'

jest.mock('../../../../components/send-email')

import {composeEmail} from '../../../../components/send-email'
import {submitReport} from '../submit'

const mockComposeEmail = composeEmail as jest.MockedFunction<typeof composeEmail>

function makeBuilding(name: string): BuildingType {
	return {
		name,
		category: 'Food',
		kind: 'building',
		schedule: [{title: 'Hours', hours: [{days: ['Mo'], from: '8:00am', to: '5:00pm'}]}],
	}
}

const CARLETON = {label: 'Carleton', supportEmail: 'carls@frogpond.tech'}
const ST_OLAF = {label: 'St. Olaf', supportEmail: 'allaboutolaf@frogpond.tech'}

describe('submitReport', () => {
	// CRITICAL regression: Bookstore, Post Office, Business Office, Financial
	// Aid, and Registrar all exist on both campuses. A subject or issue title
	// naming only the building leaves a maintainer with no way to tell which
	// campus's venue was reported.
	it('names the campus in the email subject', () => {
		submitReport(makeBuilding('Bookstore'), makeBuilding('Bookstore'), CARLETON, '')

		let [args] = mockComposeEmail.mock.calls.at(-1) as [{subject: string}]
		expect(args.subject).toBe('[building] Suggestion for Bookstore (Carleton)')
	})

	it("sends the report to the campus's support address", () => {
		submitReport(makeBuilding('Bookstore'), makeBuilding('Bookstore'), CARLETON, '')

		let [args] = mockComposeEmail.mock.calls.at(-1) as [{to: Array<string>}]
		expect(args.to).toEqual(['carls@frogpond.tech'])
	})

	it('attaches the images picked for the report', () => {
		submitReport(makeBuilding('Cage'), makeBuilding('Cage'), ST_OLAF, '', ['file:///tmp/sign.jpg'])

		let [args] = mockComposeEmail.mock.calls.at(-1) as [{attachments: Array<string>}]
		expect(args.attachments).toEqual(['file:///tmp/sign.jpg'])
	})

	it('names St. Olaf in the subject for a St. Olaf report', () => {
		submitReport(makeBuilding('Bookstore'), makeBuilding('Bookstore'), ST_OLAF, '')

		let [args] = mockComposeEmail.mock.calls.at(-1) as [{subject: string}]
		expect(args.subject).toBe('[building] Suggestion for Bookstore (St. Olaf)')
	})

	it('names the campus in the pre-filled issue title', () => {
		submitReport(makeBuilding('Registrar'), makeBuilding('Registrar'), CARLETON, '')

		let [args] = mockComposeEmail.mock.calls.at(-1) as [{body: string}]
		let issueUrl = /Project maintainers: (\S+)/u.exec(args.body)?.[1] ?? ''
		let title = new URL(issueUrl).searchParams.get('title')

		expect(title).toBe('Building update for Registrar (Carleton)')
	})

	it('puts the note in the email, above the do-not-change line', () => {
		submitReport(makeBuilding('Cage'), makeBuilding('Cage'), ST_OLAF, 'Closed all of interim.')

		let [args] = mockComposeEmail.mock.calls.at(-1) as [{body: string}]
		let noteAt = args.body.indexOf('Closed all of interim.')
		let lineAt = args.body.indexOf('------------')

		expect(noteAt).toBeGreaterThan(-1)
		expect(noteAt).toBeLessThan(lineAt)
	})

	it('puts the note in the pre-filled issue body', () => {
		submitReport(makeBuilding('Cage'), makeBuilding('Cage'), ST_OLAF, 'Closed all of interim.')

		let [args] = mockComposeEmail.mock.calls.at(-1) as [{body: string}]
		let issueUrl = /Project maintainers: (\S+)/u.exec(args.body)?.[1] ?? ''
		let body = new URL(issueUrl).searchParams.get('body') ?? ''
		let noteAt = body.indexOf('Closed all of interim.')
		let beforeAt = body.indexOf('## Before:')

		expect(noteAt).toBeGreaterThan(-1)
		expect(noteAt).toBeLessThan(beforeAt)
	})

	// The note is an addition, not a rewrite: a report without one has to look
	// exactly as it always did.
	it('changes nothing when there is no note', () => {
		submitReport(makeBuilding('Cage'), makeBuilding('Cage'), ST_OLAF, '')

		let [args] = mockComposeEmail.mock.calls.at(-1) as [{body: string}]
		expect(args.body).toContain(
			'Hi! Thanks for letting us know about a change.\n\nPlease do not change anything below this line.',
		)
	})

	// Adding a link and then leaving both fields blank must not reach a
	// maintainer as `- title: ''` / `url: ''`: it carries no information.
	it('drops a wholly blank link from the emailed diff', () => {
		let after: BuildingType = {...makeBuilding('Cage'), links: [{title: '', url: ''}]}
		submitReport(makeBuilding('Cage'), after, ST_OLAF, '')

		let [args] = mockComposeEmail.mock.calls.at(-1) as [{body: string}]
		expect(args.body).not.toContain('links:')
	})

	// A title with no url (or vice versa) is a real, if incomplete, report.
	it('keeps a link with only one of title or url filled in', () => {
		let after: BuildingType = {...makeBuilding('Cage'), links: [{title: 'Instagram', url: ''}]}
		submitReport(makeBuilding('Cage'), after, ST_OLAF, '')

		let [args] = mockComposeEmail.mock.calls.at(-1) as [{body: string}]
		expect(args.body).toContain('title: Instagram')
	})
})
