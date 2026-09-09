import {describe, expect, it, jest} from '@jest/globals'
import type {BuildingType} from '../../types'

jest.mock('../../../../components/send-email')

import {sendEmail} from '../../../../components/send-email'
import {submitReport} from '../submit'

const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>

function makeBuilding(name: string): BuildingType {
	return {
		name,
		category: 'Food',
		schedule: [{title: 'Hours', hours: [{days: ['Mo'], from: '8:00am', to: '5:00pm'}]}],
	}
}

describe('submitReport', () => {
	// CRITICAL regression: Bookstore, Post Office, Business Office, Financial
	// Aid, and Registrar all exist on both campuses. A subject or issue title
	// naming only the building leaves a maintainer with no way to tell which
	// campus's venue was reported.
	it('names the campus in the email subject', () => {
		submitReport(makeBuilding('Bookstore'), makeBuilding('Bookstore'), 'carleton')

		let [args] = mockSendEmail.mock.calls.at(-1) as [{subject: string}]
		expect(args.subject).toBe('[building] Suggestion for Bookstore (Carleton)')
	})

	it('names St. Olaf in the subject for a St. Olaf report', () => {
		submitReport(makeBuilding('Bookstore'), makeBuilding('Bookstore'), 'stolaf')

		let [args] = mockSendEmail.mock.calls.at(-1) as [{subject: string}]
		expect(args.subject).toBe('[building] Suggestion for Bookstore (St. Olaf)')
	})

	it('names the campus in the pre-filled issue title', () => {
		submitReport(makeBuilding('Registrar'), makeBuilding('Registrar'), 'carleton')

		let [args] = mockSendEmail.mock.calls.at(-1) as [{body: string}]
		let issueUrl = /Project maintainers: (\S+)/u.exec(args.body)?.[1] ?? ''
		let title = new URL(issueUrl).searchParams.get('title')

		expect(title).toBe('Building hours update for Registrar (Carleton)')
	})
})
