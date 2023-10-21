import {formatEmailParts} from '../send-email'
import {describe, expect, it} from '@jest/globals'

describe('formatEmailParts', () => {
	it('should format empty inputs', () => {
		expect(formatEmailParts({to: ['']})).toMatchInlineSnapshot('"mailto:"')
	})

	it('should encode the "to" addressees', () => {
		expect(formatEmailParts({to: ['test@domain.com']})).toMatchInlineSnapshot(
			'"mailto:test@domain.com"',
		)
		expect(
			formatEmailParts({to: ['test@domain.com', 'help@domain.com']}),
		).toMatchInlineSnapshot('"mailto:test@domain.com,help@domain.com"')
	})

	it('should encode the "cc" addressees', () => {
		expect(formatEmailParts({cc: ['test@domain.com']})).toMatchInlineSnapshot(
			'"mailto:?cc=test%40domain.com"',
		)
		expect(
			formatEmailParts({cc: ['test@domain.com', 'help@domain.com']}),
		).toMatchInlineSnapshot(
			'"mailto:?cc=test%40domain.com%2Chelp%40domain.com"',
		)
	})

	it('should encode the "bcc" addressees', () => {
		expect(formatEmailParts({bcc: ['test@domain.com']})).toMatchInlineSnapshot(
			'"mailto:?bcc=test%40domain.com"',
		)
		expect(
			formatEmailParts({bcc: ['test@domain.com', 'help@domain.com']}),
		).toMatchInlineSnapshot(
			'"mailto:?bcc=test%40domain.com%2Chelp%40domain.com"',
		)
	})

	it('should encode the subject', () => {
		expect(formatEmailParts({subject: 'a thing'})).toMatchInlineSnapshot(
			'"mailto:?subject=a+thing"',
		)
	})

	it('should encode to and subject', () => {
		expect(
			formatEmailParts({to: ['test@domain.com'], subject: 'a thing'}),
		).toMatchInlineSnapshot('"mailto:test@domain.com?subject=a+thing"')
	})

	it('should encode to, subject, and body', () => {
		expect(
			formatEmailParts({
				to: ['test@domain.com'],
				subject: 'a thing',
				body: 'hey there',
			}),
		).toMatchInlineSnapshot(
			'"mailto:test@domain.com?subject=a+thing&body=hey+there"',
		)
		expect(
			formatEmailParts({
				to: ['test@domain.com', 'test2@domain.com'],
				subject: 'a thing',
				body: 'hey there',
			}),
		).toMatchInlineSnapshot(
			'"mailto:test@domain.com,test2@domain.com?subject=a+thing&body=hey+there"',
		)
	})

	it('should encode to, cc, bcc, subject, and body', () => {
		expect(
			formatEmailParts({
				to: ['test@domain.com'],
				cc: ['test2@domain.com'],
				bcc: ['test3@domain.com'],
				subject: 'a thing',
				body: 'hey there',
			}),
		).toMatchInlineSnapshot(
			'"mailto:test@domain.com?cc=test2%40domain.com&bcc=test3%40domain.com&subject=a+thing&body=hey+there"',
		)
	})
})
