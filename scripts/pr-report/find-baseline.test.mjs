import assert from 'node:assert/strict'
import {execFileSync} from 'node:child_process'
import {mkdtempSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {describe, it} from 'node:test'

let sha = (char) => char.repeat(40)
let base = sha('b')
let older = sha('a')
let oldest = sha('9')

/**
 * Runs find-baseline.sh against fixtures/gh, which answers from `data`, and
 * returns what it prints.
 */
function findBaseline(data, ...args) {
	let dir = mkdtempSync(join(tmpdir(), 'find-baseline-'))
	let path = join(dir, 'gh.json')
	writeFileSync(path, JSON.stringify({runs: [], artifacts: {}, ancestors: {}, ...data}))
	return execFileSync(join(import.meta.dirname, 'find-baseline.sh'), args, {
		encoding: 'utf8',
		env: {
			...process.env,
			PATH: `${join(import.meta.dirname, 'fixtures')}:${process.env.PATH}`,
			FAKE_GH_DATA: path,
			GITHUB_REPOSITORY: 'o/r',
		},
	})
}

let push = (databaseId, headSha, status = 'success') => ({
	databaseId,
	headSha,
	headBranch: 'master',
	event: 'push',
	status,
})
let reports = (...names) => names.map((name) => ({name, expired: false}))

describe('find-baseline.sh for another workflow', () => {
	it("searches the named workflow's runs, not pr-report.yml's", () => {
		let iosRun = {...push(7, base), workflow: 'ios.yml'}
		let data = {
			runs: [push(2, base), iosRun],
			artifacts: {2: reports('uitest-report'), 7: reports('uitest-report')},
		}
		assert.equal(findBaseline(data, base, 'master', 'uitest-report', 'ios.yml'), `7 ${base}\n`)
		assert.equal(findBaseline(data, base, 'master', 'uitest-report'), `2 ${base}\n`)
	})
})

describe('find-baseline.sh on master', () => {
	it("picks the base commit's own run when it has the artifact", () => {
		let out = findBaseline({runs: [push(2, base)], artifacts: {2: reports('size-report')}}, base)
		assert.equal(out, `2 ${base}\n`)
	})

	it("picks the base commit's run whatever its result, as long as the artifact is there", () => {
		// A run still archiving, or one whose archive failed, has its other
		// reports all the same.
		let out = findBaseline(
			{runs: [push(2, base, 'in_progress')], artifacts: {2: reports('size-report', 'app-size')}},
			base,
			'master',
			'app-size',
		)
		assert.equal(out, `2 ${base}\n`)
	})

	it('falls back to the newest ancestor whose run has the artifact', () => {
		let out = findBaseline(
			{
				runs: [push(3, base), push(2, older), push(1, oldest)],
				artifacts: {3: reports('size-report'), 2: reports('size-report'), 1: reports('app-size')},
				ancestors: {[base]: [base, older, oldest]},
			},
			base,
			'master',
			'app-size',
		)
		assert.equal(out, `1 ${oldest}\n`)
	})

	it('skips an expired artifact', () => {
		let out = findBaseline(
			{
				runs: [push(2, base), push(1, older)],
				artifacts: {2: [{name: 'size-report', expired: true}], 1: reports('size-report')},
				ancestors: {[base]: [base, older]},
			},
			base,
		)
		assert.equal(out, `1 ${older}\n`)
	})

	it('prints nothing when no run has the artifact', () => {
		let out = findBaseline(
			{runs: [push(2, base)], artifacts: {2: reports('size-report')}, ancestors: {[base]: [base]}},
			base,
			'master',
			'app-size',
		)
		assert.equal(out, '')
	})

	it('prints nothing for something that is not a full SHA', () => {
		assert.equal(findBaseline({}, 'abc1234'), '')
	})
})

describe('find-baseline.sh on another branch', () => {
	let pr = (databaseId, headSha) => ({
		databaseId,
		headSha,
		headBranch: 'feature',
		event: 'pull_request',
		status: 'success',
	})

	it("picks that branch's pull request run for the commit when it has the artifact", () => {
		let out = findBaseline(
			{runs: [pr(5, base), pr(4, base)], artifacts: {4: reports('app-size')}},
			base,
			'feature',
			'app-size',
		)
		assert.equal(out, `4 ${base}\n`)
	})

	it('does not fall back to an older commit', () => {
		let out = findBaseline(
			{runs: [pr(4, older)], artifacts: {4: reports('size-report')}},
			base,
			'feature',
		)
		assert.equal(out, '')
	})
})

describe('find-baseline.sh --pull-request', () => {
	let pr = (databaseId, headSha, headBranch) => ({
		databaseId,
		headSha,
		headBranch,
		event: 'pull_request',
		status: 'success',
	})

	it("picks this commit's own pull request run with the artifact, whatever its branch is named", () => {
		let out = findBaseline(
			{
				runs: [pr(6, base, 'master'), pr(5, base, 'master')],
				artifacts: {5: reports('size-report')},
			},
			base,
			'--pull-request',
		)
		assert.equal(out, `5 ${base}\n`)
	})

	it('looks past many label runs, which upload no reports', () => {
		let labelRuns = Array.from({length: 12}, (_, i) => pr(100 - i, base, 'feature'))
		let out = findBaseline(
			{runs: [...labelRuns, pr(5, base, 'feature')], artifacts: {5: reports('size-report')}},
			base,
			'--pull-request',
		)
		assert.equal(out, `5 ${base}\n`)
	})

	it("never falls back to master's runs, even for a branch named master", () => {
		let out = findBaseline(
			{
				runs: [push(3, older)],
				artifacts: {3: reports('size-report')},
				ancestors: {[base]: [base, older]},
			},
			base,
			'--pull-request',
		)
		assert.equal(out, '')
	})
})
