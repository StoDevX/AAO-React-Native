/**
 * A UI-test fixture, refused when it arrives as the empty object a release
 * bundle carries in its place (metro.config.js): a UI test on such a bundle
 * fails here, naming the fix, instead of on whatever reads the fixture next.
 */
export function uiTestFixture<T>(name: string, data: T): T {
	if (data && typeof data === 'object' && Object.keys(data).length === 0) {
		throw new Error(
			`UI-test fixture ${name} is empty: this bundle was built without ` +
				'KEEP_UITEST_FIXTURES=1 -- build it with mise run bundle:ios',
		)
	}
	return data
}
