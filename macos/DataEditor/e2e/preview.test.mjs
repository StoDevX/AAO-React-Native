// The whole preview path: the helper edits and builds, ccc-server serves the
// edit. Needs CCC_ROOT, a ccc-server checkout with `npm ci` done, at the
// commit in ../ccc-server.ref. Run: CCC_ROOT=… node --test macos/DataEditor/e2e/preview.test.mjs

import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {cp, mkdtemp} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {createInterface} from 'node:readline'
import {after, before, describe, it} from 'node:test'
import {setTimeout as sleep} from 'node:timers/promises'
import {DATA_BASE, REPO_ROOT} from '../../../scripts/paths.mjs'

const CCC_ROOT = process.env['CCC_ROOT']
const PORT = 8790
const ORIGIN = `http://127.0.0.1:${PORT}/`

describe(
	'previewing an edit through ccc-server',
	{skip: !CCC_ROOT && 'CCC_ROOT is not set'},
	() => {
		let helper
		let ccc
		let lines
		let id = 0
		const call = async (method, params = {}) => {
			helper.stdin.write(`${JSON.stringify({id: ++id, method, params})}\n`)
			let reply = JSON.parse((await lines.next()).value)
			assert.equal(reply.error, undefined, JSON.stringify(reply.error))
			return reply.result
		}

		before(async () => {
			let ws = await mkdtemp(path.join(tmpdir(), 'preview-'))
			await cp(DATA_BASE, path.join(ws, 'data'), {recursive: true})
			helper = spawn(process.execPath, [
				path.join(REPO_ROOT, 'scripts/data-editor-helper.mjs'),
				'--data',
				path.join(ws, 'data'),
				'--out',
				path.join(ws, 'out'),
			])
			lines = createInterface({input: helper.stdout})[Symbol.asyncIterator]()
			ccc = spawn(process.execPath, ['source/dev/index.ts'], {
				cwd: CCC_ROOT,
				env: {...process.env, PAGES_ORIGIN_OVERRIDE: ORIGIN, CCC_PERSIST_TO: path.join(ws, 'ccc')},
				stdio: 'inherit',
				// its own process group, so stopping it stops wrangler and workerd too
				detached: true,
			})
			for (let i = 0; i < 120; i++) {
				if (
					await fetch('http://localhost:8787/').then(
						(r) => r.ok,
						() => false,
					)
				)
					return
				await sleep(500)
			}
			throw new Error('ccc-server did not start')
		})
		after(() => {
			helper?.stdin.end()
			if (ccc?.pid) process.kill(-ccc.pid, 'SIGTERM')
		})

		it('serves the edited hours', async () => {
			let {problems} = await call('edit', {
				file: 'building-hours/1-1-cage.yaml',
				ops: [{path: ['schedule', 0, 'hours', 0, 'to'], value: '11:45pm'}],
			})
			assert.deepEqual(problems, [])
			assert.deepEqual(await call('build'), {ok: true})
			await call('serve', {port: PORT})
			let hours = await (
				await fetch('http://localhost:8787/edu.stolaf/v1/spaces/hours?breaks=none')
			).json()
			assert.match(JSON.stringify(hours), /11:45pm/u)
		})

		it('redirects a data file to the Mac', async () => {
			let response = await fetch('http://localhost:8787/edu.stolaf/v1/transit/bus', {
				redirect: 'manual',
			})
			assert.equal(response.headers.get('location'), `${ORIGIN}bus-times.json`)
		})
	},
)
