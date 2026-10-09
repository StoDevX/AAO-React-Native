import {registerCampusServer} from '@frogpond/api'
import {setManifestServer} from '@frogpond/data-sources'
import {fixtureMode, uiTestCampus} from '@frogpond/launch-arguments'

import {CAMPUSES, PLATFORM_SERVER} from '../campuses'
import {installCampusFixtures} from '../features/campus/fixtures'
import * as storage from '../lib/storage'

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

// A UI test that names a campus reads that campus's recordings for every request.
if (typeof uiTestCampus === 'string') {
	installCampusFixtures(uiTestCampus, fixtureMode)
}
