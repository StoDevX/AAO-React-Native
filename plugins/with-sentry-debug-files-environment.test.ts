import assert from 'node:assert/strict'
import {join} from 'node:path'
import {describe, it} from 'node:test'

import {getDebugFilesUploadScript} from '@sentry/react-native/plugin/build/withSentryIOS.js'
import xcode from 'xcode'
import type {XcodeProject} from 'xcode'

import {
	LOAD_XCODE_ENV,
	loadXcodeEnvForSentryDebugFiles,
} from './with-sentry-debug-files-environment.ts'

const PHASE_NAME = 'Upload Debug Symbols to Sentry'

function loadProject(): XcodeProject {
	let project = xcode.project(join(import.meta.dirname, 'fixtures/project.pbxproj'))
	project.parseSync()
	return project
}

/** The fixture project with the phase exactly as Sentry's own plugin writes it. */
function withSentryPhase(): XcodeProject {
	let project = loadProject()
	project.addBuildPhase([], 'PBXShellScriptBuildPhase', PHASE_NAME, undefined, {
		shellPath: '/bin/sh',
		shellScript: getDebugFilesUploadScript(),
	})
	return project
}

function phaseScript(project: XcodeProject): string {
	let phase = project.pbxItemByComment(PHASE_NAME, 'PBXShellScriptBuildPhase') as {
		shellScript: string
	}
	return JSON.parse(phase.shellScript) as string
}

describe('loadXcodeEnvForSentryDebugFiles', () => {
	it('loads .xcode.env before the line that looks for node', () => {
		let script = phaseScript(loadXcodeEnvForSentryDebugFiles(withSentryPhase()))
		assert.ok(script.startsWith(`${LOAD_XCODE_ENV}\n`))
		assert.ok(script.includes('NODE_BINARY'))
		assert.ok(script.indexOf('.xcode.env.local') < script.indexOf('NODE_BINARY'))
	})

	it('keeps the rest of the script as Sentry wrote it', () => {
		let original = phaseScript(withSentryPhase())
		let script = phaseScript(loadXcodeEnvForSentryDebugFiles(withSentryPhase()))
		assert.ok(script.endsWith(original))
	})

	it('changes nothing on a second run', () => {
		let once = phaseScript(loadXcodeEnvForSentryDebugFiles(withSentryPhase()))
		let project = withSentryPhase()
		loadXcodeEnvForSentryDebugFiles(project)
		loadXcodeEnvForSentryDebugFiles(project)
		assert.equal(phaseScript(project), once)
	})

	it('fails loudly when the Sentry phase is missing', () => {
		assert.throws(() => loadXcodeEnvForSentryDebugFiles(loadProject()), /listed after this plugin/u)
	})
})
