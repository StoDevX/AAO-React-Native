import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {test} from 'node:test'

let SCRIPT = new URL('watch-lions-pantry.sh', import.meta.url).pathname
let FIXTURE = new URL('fixtures/lions-pantry/pantry.html', import.meta.url).pathname

let hasHtmlq = spawnSync('htmlq', ['--version']).status === 0

/** Runs the watcher against a page held in a temp file. */
function watch(html) {
	let dir = mkdtempSync(join(tmpdir(), 'lions-pantry-'))
	try {
		let file = join(dir, 'page.html')
		writeFileSync(file, html)
		let result = spawnSync(SCRIPT, [file], {encoding: 'utf8'})
		return {status: result.status, out: result.stdout}
	} finally {
		rmSync(dir, {recursive: true})
	}
}

let page = readFileSync(FIXTURE, 'utf8')

test('exits 0 when the hours line matches the snapshot', {skip: !hasHtmlq}, () => {
	let result = watch(page)
	assert.equal(result.status, 0)
	assert.match(result.out, /^Unchanged: /u)
})

test('exits 1 and names both lines when the hours change', {skip: !hasHtmlq}, () => {
	let result = watch(page.replace('12pm-1pm', '1pm-2pm'))
	assert.equal(result.status, 1)
	assert.match(result.out, /Was: .*12pm-1pm/u)
	assert.match(result.out, /Now: .*1pm-2pm/u)
})

test('exits 1 when the Pantry PROCESS section is gone', {skip: !hasHtmlq}, () => {
	let result = watch(page.replace('Pantry PROCESS', 'Process'))
	assert.equal(result.status, 1)
	assert.match(result.out, /missing/u)
})
