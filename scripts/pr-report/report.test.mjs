import assert from 'node:assert/strict'
import {mkdtempSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {buildPrReport, readReport} from './report.mjs'

let report = (hermesBytes, version = 1) => ({
	version,
	sha: 'x',
	js: {minifiedBytes: 100, hermesBytes, byPackage: {a: 1}, byFeature: {}},
})

describe('readReport', () => {
	let dir = mkdtempSync(join(tmpdir(), 'pr-report-'))

	it('reads a report', () => {
		let path = join(dir, 'ok.json')
		writeFileSync(path, JSON.stringify(report(5)))
		assert.deepEqual(readReport(path), report(5))
	})

	it('returns null for a missing file', () => {
		assert.equal(readReport(join(dir, 'absent.json')), null)
	})

	it('returns null for a file that is not JSON', () => {
		let path = join(dir, 'bad.json')
		writeFileSync(path, '<html>expired</html>')
		assert.equal(readReport(path), null)
	})
})

describe('buildPrReport', () => {
	it('fails the gate when growth is over the limit', () => {
		let result = buildPrReport({
			head: report(300),
			baseline: report(100),
			baseSha: 'abcdef1234',
			labels: [],
			limit: 100,
		})
		assert.equal(result.pass, false)
		assert.match(result.markdown, /Changed most|All packages/u)
	})

	it('passes with a note when there is no baseline', () => {
		let result = buildPrReport({
			head: report(300),
			baseline: null,
			baseSha: 'abcdef1234',
			labels: [],
			limit: 100,
		})
		assert.equal(result.pass, true)
		assert.match(result.markdown, /No baseline for `abcdef1`/u)
	})

	it('passes with a note when the baseline is another format version', () => {
		let result = buildPrReport({
			head: report(300),
			baseline: report(100, 0),
			baseSha: 'abcdef1234',
			labels: [],
			limit: 100,
		})
		assert.equal(result.pass, true)
		assert.match(result.markdown, /Baseline format changed/u)
	})

	it('fails when this commit has no report', () => {
		let result = buildPrReport({
			head: null,
			baseline: report(100),
			baseSha: 'abcdef1234',
			labels: [],
			limit: 100,
		})
		assert.equal(result.pass, false)
		assert.match(result.markdown, /JS size unavailable/u)
	})
})
