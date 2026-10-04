import {useChaosFindings} from '../findings'
import {chaosFetch, type ChaosFetchOptions} from '../fetch'
import {memoryLineFile} from '../line-file'
import {seededRandom} from '../random'
import {parseLines, type TapeEntry} from '../tape'

const URL_A = 'https://a.test/menu'

/** A stand-in for the network: answers every request with `body`. */
function server(body = '{"ok":true}', status = 200) {
	return jest.fn(() =>
		Promise.resolve(new Response(body, {status, headers: {'content-type': 'application/json'}})),
	)
}

// "SQL", then the NULs a string-backed body loses on its way to native code.
const CATALOG_BYTES = new Uint8Array([83, 81, 76, 0, 255, 0, 1])

/** A stand-in for a server sending a binary file, such as the course catalog. */
function fileServer() {
	return jest.fn(() =>
		Promise.resolve(
			new Response(CATALOG_BYTES, {headers: {'content-type': 'application/octet-stream'}}),
		),
	)
}

function options(overrides: Partial<ChaosFetchOptions> = {}): ChaosFetchOptions {
	return {
		mode: 'record',
		launch: 0,
		random: seededRandom(1),
		faultRate: 0,
		tape: memoryLineFile(),
		sleep: () => Promise.resolve(),
		...overrides,
	}
}

beforeEach(() => {
	useChaosFindings.setState({latest: '', file: null})
})

describe('record mode', () => {
	test('passes an unfaulted response through and records it', async () => {
		let tape = memoryLineFile()
		let wrapped = chaosFetch(server(), options({tape}))
		let response = await wrapped(URL_A)
		expect(await response.json()).toEqual({ok: true})
		let [entry] = parseLines<TapeEntry>(tape.readLines())
		expect(entry).toMatchObject({
			key: `0 GET ${URL_A} #0`,
			status: 200,
			body: '{"ok":true}',
			fault: 'none',
		})
	})

	test('faults every request at rate 1, and records what it delivered', async () => {
		let tape = memoryLineFile()
		let wrapped = chaosFetch(server(), options({tape, faultRate: 1}))
		for (let i = 0; i < 20; i++) {
			// Sequential, not parallel: each call's occurrence number depends on the one before it.
			// oxlint-disable-next-line no-await-in-loop
			await wrapped(URL_A).catch(() => undefined)
		}
		let entries = parseLines<TapeEntry>(tape.readLines())
		expect(entries).toHaveLength(20)
		expect(entries.every((e) => e.fault !== 'none')).toBe(true)
	})

	test('fails a network fault the way fetch does, without reaching the network', async () => {
		let network = server()
		let random = seededRandom(1)
		let wrapped = chaosFetch(network, options({faultRate: 1, random}))
		let failures = 0
		for (let i = 0; i < 50; i++) {
			// Sequential, not parallel: each call's occurrence number depends on the one before it.
			// oxlint-disable-next-line no-await-in-loop
			await wrapped(URL_A).catch((error: unknown) => {
				expect(error).toBeInstanceOf(TypeError)
				failures++
			})
		}
		expect(failures).toBeGreaterThan(0)
		expect(network.mock.calls.length).toBe(50 - failures)
	})

	test('refuses a blocked URL without reaching the network', async () => {
		let network = server()
		let wrapped = chaosFetch(network, options())
		await expect(wrapped('https://papercut.stolaf.edu/rpc/api')).rejects.toBeInstanceOf(TypeError)
		expect(network).not.toHaveBeenCalled()
	})

	// Read as text, rebuilt as a string, and then read as bytes, a binary body
	// crashes the app on a device, so the app gets the real response.
	test('passes a binary response through untouched, and leaves its body off the tape', async () => {
		let tape = memoryLineFile()
		let network = fileServer()
		let wrapped = chaosFetch(network, options({tape}))
		let response = await wrapped(URL_A)
		expect(response).toBe(await network.mock.results[0].value)
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(CATALOG_BYTES)
		let [entry] = parseLines<TapeEntry>(tape.readLines())
		expect(entry).toMatchObject({status: 200, body: '', fault: 'none', live: true})
	})

	test('faults a binary response only in ways that leave its body alone', async () => {
		let tape = memoryLineFile()
		let wrapped = chaosFetch(fileServer(), options({tape, faultRate: 1}))
		for (let i = 0; i < 50; i++) {
			// Sequential, not parallel: each call's occurrence number depends on the one before it.
			// oxlint-disable-next-line no-await-in-loop
			await wrapped(URL_A).catch(() => undefined)
		}
		let entries = parseLines<TapeEntry>(tape.readLines())
		let faults = new Set(entries.map((e) => e.fault))
		expect([...faults].sort()).toEqual(['latency', 'network', 'none', 'status'])
		for (let entry of entries.filter((e) => e.fault === 'status')) {
			expect(entry).toMatchObject({body: ''})
			expect(entry.live).toBeFalsy()
		}
	})

	test('never reads the tape, which only a replay needs', async () => {
		let tape = memoryLineFile()
		let readLines = jest.spyOn(tape, 'readLines')
		let wrapped = chaosFetch(server(), options({tape}))
		await wrapped(URL_A)
		expect(readLines).not.toHaveBeenCalled()
	})

	test('records an aborted request as an abort', async () => {
		let tape = memoryLineFile()
		let aborting = jest.fn(() => {
			throw Object.assign(new Error('Aborted'), {name: 'AbortError'})
		})
		let wrapped = chaosFetch(aborting, options({tape}))
		await expect(wrapped(URL_A)).rejects.toMatchObject({name: 'AbortError'})
		expect(parseLines<TapeEntry>(tape.readLines())[0].error).toBe('abort')
	})

	test('waits out a latency fault', async () => {
		let sleep = jest.fn((_ms: number) => Promise.resolve())
		let wrapped = chaosFetch(server(), options({faultRate: 1, sleep}))
		for (let i = 0; i < 30; i++) {
			// Sequential, not parallel: each call's occurrence number depends on the one before it.
			// oxlint-disable-next-line no-await-in-loop
			await wrapped(URL_A).catch(() => undefined)
		}
		expect(sleep.mock.calls.some(([ms]) => ms >= 500)).toBe(true)
	})
})

describe('replay mode', () => {
	async function recordThenReplay(requests: (f: typeof fetch) => Promise<unknown>) {
		let tape = memoryLineFile()
		let recorder = chaosFetch(server(), options({tape, faultRate: 0.5}))
		await requests(recorder)
		let network = server('{"live":true}')
		let player = chaosFetch(network, options({tape, mode: 'replay', random: seededRandom(999)}))
		return {player, network, tape}
	}

	test('answers from the tape without reaching the network', async () => {
		let {player, network} = await recordThenReplay(async (f) => {
			await f(URL_A).catch(() => undefined)
		})
		await player(URL_A).catch(() => undefined)
		expect(network).not.toHaveBeenCalled()
	})

	test('delivers what was recorded, faults included', async () => {
		let tape = memoryLineFile()
		let recorder = chaosFetch(server(), options({tape, faultRate: 1}))
		let recorded: string[] = []
		for (let i = 0; i < 10; i++) {
			// Sequential, not parallel: each call's occurrence number depends on the one before it.
			recorded.push(
				// oxlint-disable-next-line no-await-in-loop
				await recorder(URL_A).then(
					(r) => r.text(),
					(e: Error) => `threw ${e.name}`,
				),
			)
		}
		let player = chaosFetch(server('{"live":true}'), options({tape, mode: 'replay'}))
		let replayed: string[] = []
		for (let i = 0; i < 10; i++) {
			// Sequential, not parallel: each call's occurrence number depends on the one before it.
			replayed.push(
				// oxlint-disable-next-line no-await-in-loop
				await player(URL_A).then(
					(r) => r.text(),
					(e: Error) => `threw ${e.name}`,
				),
			)
		}
		expect(replayed).toEqual(recorded)
	})

	test('matches concurrent requests to different URLs in any order', async () => {
		let tape = memoryLineFile()
		let recorder = chaosFetch(server(), options({tape}))
		await recorder('https://a.test/one')
		await recorder('https://a.test/two')
		let player = chaosFetch(server(), options({tape, mode: 'replay'}))
		await expect(player('https://a.test/two')).resolves.toBeInstanceOf(Response)
		await expect(player('https://a.test/one')).resolves.toBeInstanceOf(Response)
	})

	test('replays an abort as an abort, not a divergence', async () => {
		let tape = memoryLineFile()
		let aborting = jest.fn(() => {
			throw Object.assign(new Error('Aborted'), {name: 'AbortError'})
		})
		await chaosFetch(aborting, options({tape}))(URL_A).catch(() => undefined)
		let player = chaosFetch(server(), options({tape, mode: 'replay'}))
		await expect(player(URL_A)).rejects.toMatchObject({name: 'AbortError'})
		expect(useChaosFindings.getState().latest).toBe('')
	})

	test('fetches a binary response again, since the tape left its body out', async () => {
		let tape = memoryLineFile()
		await chaosFetch(fileServer(), options({tape}))(URL_A)
		let network = fileServer()
		let player = chaosFetch(network, options({tape, mode: 'replay'}))
		let response = await player(URL_A)
		expect(network).toHaveBeenCalledTimes(1)
		expect(new Uint8Array(await response.arrayBuffer())).toEqual(CATALOG_BYTES)
	})

	test('reports a request the tape has no answer for as a divergence', async () => {
		let player = chaosFetch(server(), options({mode: 'replay'}))
		await expect(player(URL_A)).rejects.toBeInstanceOf(TypeError)
		expect(useChaosFindings.getState().latest).toBe(
			`divergence: no recorded answer for 0 GET ${URL_A} #0`,
		)
	})
})
