import assert from 'node:assert/strict'
import {test} from 'node:test'

import {buildArgs, isNotInstalled, testArgs} from './uitest-run.mjs'

test('detects when the app is not installed from simctl stderr', () => {
	let stderr = `An error was encountered processing the command (domain=NSPOSIXErrorDomain, code=2):
	The operation couldn't be completed. No such file or directory`
	assert.strictEqual(isNotInstalled(stderr), true)
})

test('treats other simctl errors as real failures, not missing app', () => {
	assert.strictEqual(isNotInstalled('Invalid device: ABC'), false)
})

test('builds for the named simulator without signing', () => {
	let args = buildArgs('ABC')
	assert.ok(args.includes('platform=iOS Simulator,id=ABC'))
	assert.ok(args.includes('CODE_SIGNING_ALLOWED=NO'))
	assert.ok(args.includes('-only-testing:AllAboutOlafUITests'))
})

test('runs only the named tests, into a result bundle when asked', () => {
	assert.deepEqual(
		testArgs({
			udid: 'ABC',
			xctestrun: 'x.xctestrun',
			only: ['AllAboutOlafUITests/ChaosTests'],
			resultBundle: 'out',
		}),
		[
			'test-without-building',
			'-xctestrun',
			'x.xctestrun',
			'-destination',
			'platform=iOS Simulator,id=ABC',
			'-only-testing:AllAboutOlafUITests/ChaosTests',
			'-resultBundlePath',
			'out',
		],
	)
})
