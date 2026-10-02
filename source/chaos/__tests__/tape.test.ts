import {memoryLineFile} from '../line-file'
import {parseLines, readTape, RequestCounter, requestKey, type TapeEntry} from '../tape'

let entry = (key: string): TapeEntry => ({
	key,
	status: 200,
	headers: [['content-type', 'application/json']],
	body: '{}',
	delayMs: 0,
	error: null,
	fault: 'none',
})

describe('requestKey', () => {
	test('names the launch, method, URL and occurrence', () => {
		expect(requestKey(2, 'GET', 'https://a.test/x', 0)).toBe('2 GET https://a.test/x #0')
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
