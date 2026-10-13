// UI-test fixtures -- the JSON copies of live data in a feature's __fixtures__
// folder -- are read only under --uitesting, so a release bundle carries an
// empty object in their place. metro.config.js applies this.

import path from 'node:path'

/** What a stubbed fixture resolves to. */
export const EMPTY_FIXTURE = path.join(import.meta.dirname, 'empty-fixture.json')

const FIXTURE_DATA = /[\\/]__fixtures__[\\/](?:[^\\/]+[\\/])*[^\\/]+\.json$/u

/**
 * Whether a bundle swaps the fixture at `filePath` for the empty one: a
 * production bundle does, unless it is made for UI tests (`keep`). A
 * development bundle never does, as local UI tests read fixtures through Metro.
 */
export function stubsFixture(filePath, {dev, keep}) {
	return !dev && !keep && FIXTURE_DATA.test(filePath)
}
