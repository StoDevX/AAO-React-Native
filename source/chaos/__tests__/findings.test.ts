import {memoryLineFile} from '../line-file'
import {
	describe as describeError,
	reportFinding,
	reportOutOfApp,
	setFindingsFile,
	useChaosFindings,
} from '../findings'
import {parseLines} from '../tape'

beforeEach(() => {
	useChaosFindings.setState({latest: '', file: null})
})

describe('reportFinding', () => {
	test('records the launch a finding was made in', () => {
		let file = memoryLineFile()
		setFindingsFile(file, 4)
		reportFinding('console-error', 'boom')
		expect(JSON.parse(file.readLines()[0])).toMatchObject({kind: 'console-error', launch: 4})
	})

	test('writes every finding to the findings file', () => {
		let file = memoryLineFile()
		setFindingsFile(file)
		reportFinding('console-error', 'a warning')
		reportFinding('fatal', new Error('boom'))
		let written = parseLines<{kind: string; message: string}>(file.readLines())
		expect(written.map((f) => [f.kind, f.message])).toEqual([
			['console-error', 'a warning'],
			['fatal', 'boom'],
		])
	})

	test('shows only stopping findings on the beacon', () => {
		reportFinding('console-error', 'a warning')
		expect(useChaosFindings.getState().latest).toBe('')
		reportFinding('fatal', new Error('boom'))
		expect(useChaosFindings.getState().latest).toBe('fatal: boom')
	})

	test('keeps the first stopping finding on the beacon', () => {
		reportFinding('fatal', new Error('first'))
		reportFinding('unhandled-rejection', new Error('second'))
		expect(useChaosFindings.getState().latest).toBe('fatal: first')
	})
})

describe('reportOutOfApp', () => {
	test('records a warning, not a stop', () => {
		let file = memoryLineFile()
		setFindingsFile(file)
		reportOutOfApp('mailto:someone@stolaf.edu')
		expect(useChaosFindings.getState().latest).toBe('')
		expect(file.readLines()[0]).toContain('out-of-app')
	})
})

describe('describe', () => {
	test('takes an Error apart', () => {
		let {message, stack} = describeError(new Error('boom'))
		expect(message).toBe('boom')
		expect(stack).toContain('boom')
	})

	test('survives an object with a cycle', () => {
		let looped: Record<string, unknown> = {}
		looped.self = looped
		expect(describeError(looped).message).toBe('[object Object]')
	})

	test('joins several console arguments', () => {
		expect(describeError(['Warning: %s', 'key']).message).toBe('Warning: %s key')
	})

	test('survives an object whose toString throws', () => {
		let evil = {
			toString() {
				throw new Error('x')
			},
		}
		expect(describeError(evil).message).toBe('[unprintable]')
	})
})

describe('reportFinding robustness', () => {
	test('does not throw when describing an unprintable object', () => {
		let evil = {
			toString() {
				throw new Error('x')
			},
		}
		expect(() => reportFinding('fatal', evil)).not.toThrow()
		expect(useChaosFindings.getState().latest).toBe('fatal: [unprintable]')
	})

	test('still updates beacon when file append throws', () => {
		let file = {
			append: jest.fn(() => {
				throw new Error('disk full')
			}),
			readLines: jest.fn(() => []),
		}
		setFindingsFile(file)
		expect(() => reportFinding('fatal', new Error('boom'))).not.toThrow()
		expect(useChaosFindings.getState().latest).toBe('fatal: boom')
	})
})
