/* eslint-env jest */
import {formatEmailParts} from '../send-email'

describe('formatEmailParts', () => {
	it('should format empty inputs', () => {
		expect(formatEmailParts({to: ['']})).toBe('mailto:?body=&subject=')
	})

	it('should encode the "to" addressees', () => {
		expect(formatEmailParts({to: ['test@domain.com']})).toBe(
			'mailto:test%40domain.com?body=&subject=',
		)
		expect(formatEmailParts({to: ['test@domain.com', 'help@domain.com']})).toBe(
			'mailto:test%40domain.com%2Chelp%40domain.com?body=&subject=',
		)
	})

	it('should encode the "cc" addressees', () => {
		expect(formatEmailParts({cc: ['test@domain.com']})).toBe(
			'mailto:?body=&cc=test%40domain.com&subject=',
		)
		expect(formatEmailParts({cc: ['test@domain.com', 'help@domain.com']})).toBe(
			'mailto:?body=&cc=test%40domain.com&cc=help%40domain.com&subject=',
		)
	})

	it('should encode the "bcc" addressees', () => {
		expect(formatEmailParts({bcc: ['test@domain.com']})).toBe(
			'mailto:?bcc=test%40domain.com&body=&subject=',
		)
		expect(
			formatEmailParts({bcc: ['test@domain.com', 'help@domain.com']}),
		).toBe('mailto:?bcc=test%40domain.com&bcc=help%40domain.com&body=&subject=')
	})

	it('should encode the subject', () => {
		expect(formatEmailParts({subject: 'a thing'})).toBe(
			'mailto:?body=&subject=a%20thing',
		)
	})

	it('should encode to and subject', () => {
		expect(
			formatEmailParts({to: ['test@domain.com'], subject: 'a thing'}),
		).toBe('mailto:test%40domain.com?body=&subject=a%20thing')
	})

	it('should encode to, subject, and body', () => {
		expect(
			formatEmailParts({
				to: ['test@domain.com'],
				subject: 'a thing',
				body: 'hello',
			}),
		).toBe('mailto:test%40domain.com?body=hello&subject=a%20thing')
		expect(
			formatEmailParts({
				to: ['test@domain.com', 'test2@domain.com'],
				subject: 'a thing',
				body: 'hello',
			}),
		).toBe(
			'mailto:test%40domain.com%2Ctest2%40domain.com?body=hello&subject=a%20thing',
		)
	})

	it('should encode to, cc, bcc, subject, and body', () => {
		expect(
			formatEmailParts({
				to: ['test@domain.com'],
				cc: ['test2@domain.com'],
				bcc: ['test3@domain.com'],
				subject: 'a thing',
				body: 'hello',
			}),
		).toBe(
			'mailto:test%40domain.com?bcc=test3%40domain.com&body=hello&cc=test2%40domain.com&subject=a%20thing',
		)
	})
})
