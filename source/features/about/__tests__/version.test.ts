import {versionDetails} from '../version'

describe('versionDetails', () => {
	it('steps from the version to the build number to the commit', () => {
		expect(versionDetails('2.8.0', '17', 'a1b2c3d')).toEqual([
			{label: 'App Version', value: '2.8.0'},
			{label: 'App Build', value: '17'},
			{label: 'App Commit', value: 'a1b2c3d'},
		])
	})

	it('leaves out a commit that repeats the build number, as a local build does', () => {
		expect(versionDetails('2.8.0', 'a1b2c3d', 'a1b2c3d')).toEqual([
			{label: 'App Version', value: '2.8.0'},
			{label: 'App Build', value: 'a1b2c3d'},
		])
	})

	it('leaves out what the build does not know', () => {
		expect(versionDetails('2.8.0', null, undefined)).toEqual([
			{label: 'App Version', value: '2.8.0'},
		])
	})

	it('falls back when the native version is unavailable', () => {
		expect(versionDetails(null, '17', undefined)).toEqual([
			{label: 'App Version', value: 'unknown'},
			{label: 'App Build', value: '17'},
		])
	})
})
