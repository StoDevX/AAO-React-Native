import {clientFor} from '@frogpond/api'
import {servesBundledFixtures} from '@frogpond/launch-arguments'

import bundled from '../../../../docs/building-directory.json'
import {useForceBundledData} from '../../building-hours/dev/data-source-store'
import type {BuildingDirectory} from './types'

const bundledDirectories = (bundled as {data: Array<BuildingDirectory>}).data

/**
 * Every St. Olaf building's directory. UI tests naming no campus and the dev override read
 * this repository's copy, as the Hours data does. The server's copy is
 * read otherwise. A card is whole without a directory, so a failed fetch
 * just leaves it out.
 */
export async function fetchDirectories(signal: AbortSignal): Promise<Array<BuildingDirectory>> {
	if (servesBundledFixtures || useForceBundledData.getState().forced) {
		return bundledDirectories
	}
	// St. Olaf's server answers the directory for every campus.
	let response = await clientFor('edu.stolaf').get('spaces/directory', {signal}).json()
	return (response as {data: Array<BuildingDirectory>}).data
}
