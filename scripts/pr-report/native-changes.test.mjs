import assert from 'node:assert/strict'
import {describe, it} from 'node:test'

import {findNativeChanges} from './native-changes.mjs'

let bumped = (name) => ({name, kind: 'bumped', before: ['1.0.0'], after: ['1.1.0']})

describe('findNativeChanges', () => {
	it('returns null when nothing native changed', () => {
		let changes = findNativeChanges({
			files: ['source/features/dining/store.ts', 'data/ksto-schedule.yaml'],
			packageChanges: [bumped('date-fns'), bumped('@tanstack/react-query')],
		})
		assert.equal(changes, null)
	})

	it('groups changed files by what they change', () => {
		let changes = findNativeChanges({
			files: [
				'app.config.ts',
				'plugins/with-alternate-icons.ts',
				'plugins/with-alternate-icons.test.ts',
				'modules/audio-route/ios/AudioRouteModule.swift',
				'modules/audio-route/ios/AudioRoute.podspec',
				'modules/audio-route/src/index.ts',
				'source/features/dining/store.ts',
			],
			packageChanges: [],
		})
		assert.deepEqual(changes, {
			config: ['app.config.ts', 'plugins/with-alternate-icons.ts'],
			code: [
				'modules/audio-route/ios/AudioRoute.podspec',
				'modules/audio-route/ios/AudioRouteModule.swift',
			],
			packages: [],
		})
	})

	it('keeps the dependencies that ship native code', () => {
		let changes = findNativeChanges({
			files: [],
			packageChanges: [
				bumped('expo-audio'),
				bumped('@expo/ui'),
				bumped('react-native-zeroconf'),
				bumped('@react-native-async-storage/async-storage'),
				bumped('react-native'),
				bumped('date-fns'),
				bumped('expo-modules-core'),
			],
		})
		assert.deepEqual(
			changes.packages.map((change) => change.name),
			[
				'expo-audio',
				'@expo/ui',
				'react-native-zeroconf',
				'@react-native-async-storage/async-storage',
				'react-native',
				'expo-modules-core',
			],
		)
	})

	it('ignores a changed test beside a plugin', () => {
		assert.equal(
			findNativeChanges({files: ['plugins/with-custom-symbols.test.ts'], packageChanges: []}),
			null,
		)
	})
})
