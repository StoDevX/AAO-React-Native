import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {UPLOAD_KEY_VARIABLES, addReleaseSigning} from './with-android-release-signing.ts'

/** android/app/build.gradle as prebuild writes it before this plugin runs. */
const STOCK_BUILD_GRADLE = readFileSync(
	join(import.meta.dirname, 'fixtures', 'build.gradle'),
	'utf8',
)

/** The first `<name> {` block, braces balanced. */
function block(gradle: string, name: string): string {
	let start = gradle.indexOf(`${name} {`)
	assert.notEqual(start, -1, `no ${name} block`)
	let depth = 0
	for (let index = gradle.indexOf('{', start); index < gradle.length; index++) {
		if (gradle[index] === '{') {
			depth++
		} else if (gradle[index] === '}' && --depth === 0) {
			return gradle.slice(start, index + 1)
		}
	}
	throw new Error(`unbalanced ${name} block`)
}

describe('addReleaseSigning', () => {
	let signed = addReleaseSigning(STOCK_BUILD_GRADLE)
	let buildTypes = block(signed, 'buildTypes')

	it('signs the release build type with the upload key when there is one', () => {
		assert.match(
			block(buildTypes, 'release'),
			/signingConfig uploadKey != null \? signingConfigs\.release : signingConfigs\.debug/u,
		)
	})

	// A debug build signed with the upload key would put that key on every
	// developer's machine.
	it('leaves the debug build type on the debug key', () => {
		assert.match(block(buildTypes, 'debug'), /signingConfig signingConfigs\.debug\n/u)
	})

	it('declares the release signingConfig only when there is a key', () => {
		let signingConfigs = block(signed, 'signingConfigs')
		assert.match(signingConfigs, /if \(uploadKey != null\) \{\s*release \{/u)
		assert.match(signingConfigs, /debug \{\s*storeFile file\('debug\.keystore'\)/u)
	})

	it('reads every part of the key from the environment', () => {
		for (let variable of Object.values(UPLOAD_KEY_VARIABLES)) {
			assert.ok(signed.includes(`'${variable}'`), variable)
		}
	})

	// Gradle evaluates `uploadKey` inside `android {`, so it must exist first.
	it('defines the key before the android block reads it', () => {
		assert.ok(signed.indexOf('def uploadKey') < signed.indexOf('\nandroid {'))
	})

	it('changes nothing on a second run', () => {
		assert.equal(addReleaseSigning(signed), signed)
	})

	it('refuses a template whose release build type no longer uses the debug key', () => {
		let changed = STOCK_BUILD_GRADLE.replaceAll(
			'signingConfig signingConfigs.debug',
			'signingConfig signingConfigs.other',
		)
		assert.throws(() => addReleaseSigning(changed), /no longer signs with signingConfigs\.debug/u)
	})
})
