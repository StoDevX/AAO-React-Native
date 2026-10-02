import {memoryLineFile} from '../line-file'
import {parseLines, readTape, RequestCounter, requestKey, stableUrl, type TapeEntry} from '../tape'

let entry = (key: string): TapeEntry => ({
	key,
	status: 200,
	headers: [['content-type', 'application/json']],
	body: '{}',
	delayMs: 0,
	error: null,
	fault: 'none',
})

describe('stableUrl', () => {
	test('drops a numeric cache-busting _ parameter', () => {
		expect(stableUrl('https://clients3.google.com/generate_204?_=1759400000000')).toBe(
			'https://clients3.google.com/generate_204',
		)
	})

	test('drops only the _ parameter, keeping every other one in order', () => {
		expect(stableUrl('https://a.test/x?q=1&_=123')).toBe('https://a.test/x?q=1')
	})

	test('leaves a non-numeric _ parameter alone', () => {
		expect(stableUrl('https://a.test/x?_=abc')).toBe('https://a.test/x?_=abc')
	})

	test('returns a malformed URL unchanged', () => {
		expect(stableUrl('not a url')).toBe('not a url')
	})
})

describe('requestKey', () => {
	test('names the launch, method, URL and occurrence', () => {
		expect(requestKey(2, 'GET', 'https://a.test/x', 0)).toBe('2 GET https://a.test/x #0')
	})

	test('keys a cache-busted URL the same as its stable form', () => {
		expect(requestKey(0, 'HEAD', 'https://a.test/ping?_=111', 0)).toBe(
			requestKey(0, 'HEAD', 'https://a.test/ping?_=222', 0),
		)
	})
})

describe('RequestCounter', () => {
	test('counts each method and URL on its own', () => {
		let counter = new RequestCounter()
		expect(counter.next('GET', 'https://a.test/x')).toBe(0)
		expect(counter.next('GET', 'https://a.test/y')).toBe(0)
		expect(counter.next('GET', 'https://a.test/x')).toBe(1)
		expect(counter.next('POST', 'https://a.test/x')).toBe(0)
	})

	test('counts repeated cache-busted calls to one endpoint as its occurrences', () => {
		let counter = new RequestCounter()
		expect(counter.next('HEAD', 'https://a.test/ping?_=111')).toBe(0)
		expect(counter.next('HEAD', 'https://a.test/ping?_=222')).toBe(1)
	})
})

describe('readTape', () => {
	test('finds each entry by its key', () => {
		let file = memoryLineFile()
		file.append(JSON.stringify(entry('0 GET https://a.test/x #0')))
		file.append(JSON.stringify(entry('0 GET https://a.test/x #1')))
		let tape = readTape(file)
		expect(tape.get('0 GET https://a.test/x #1')?.key).toBe('0 GET https://a.test/x #1')
		expect(tape.size).toBe(2)
	})

	test('skips a line torn by a crash mid-write', () => {
		let file = memoryLineFile([JSON.stringify(entry('0 GET https://a.test/x #0')), '{"key":"0 GE'])
		expect(readTape(file).size).toBe(1)
	})

	test('is empty for an empty file', () => {
		expect(readTape(memoryLineFile()).size).toBe(0)
	})
})

describe('parseLines', () => {
	test('ignores blank lines', () => {
		expect(parseLines<{a: number}>(['{"a":1}', '', '{"a":2}'])).toEqual([{a: 1}, {a: 2}])
	})
})
