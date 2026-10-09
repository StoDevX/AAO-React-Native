import {registerCampusServer} from '@frogpond/api'
import {setManifestServer} from '@frogpond/data-sources'
import {fixtureMode, uiTestCampus} from '@frogpond/launch-arguments'

import {CAMPUSES, PLATFORM_SERVER} from '../campuses'
import {
	fixtureCampusChanged,
	installCampusFixtures,
	installFixtureServer,
} from '../features/campus/fixtures'
import {useCampusStore} from '../features/campus/store'
import * as storage from '../lib/storage'
import {queryClient} from './tanstack-query'

/**
 * Points every campus's client at its default server. Synchronous, so a client
 * asked for while the saved addresses are still being read finds its campus.
 */
export function registerDefaultServers(): void {
	for (let campus of CAMPUSES) {
		registerCampusServer(campus.id, new URL(campus.api.defaultUrl))
	}
}

/** Points each campus a developer gave a server of its own at that server. */
export async function applySavedServers(): Promise<void> {
	await Promise.all(
		CAMPUSES.map(async (campus) => {
			let address = await storage.getServerAddressFor(campus.api.storageKey)
			if (address) {
				registerCampusServer(campus.id, new URL(address))
			}
		}),
	)
}

registerDefaultServers()
setManifestServer(PLATFORM_SERVER)
void applySavedServers()

// A UI test that names a campus reads that campus's recordings for every
// request. Otherwise a campus with no server of its own (Wiki Monkeys) is
// answered from its fixtures while it is active, and only then; a request made
// before the saved campus loads waits for it. Switching to or from such a
// campus drops whatever the other campus's servers answered.
if (typeof uiTestCampus === 'string') {
	installCampusFixtures(uiTestCampus, fixtureMode)
} else {
	installFixtureServer(useCampusStore)
	useCampusStore.subscribe((state, prev) => {
		if (fixtureCampusChanged(prev.campus, state.campus)) {
			void queryClient.invalidateQueries()
		}
	})
}
