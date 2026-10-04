import {client} from '@frogpond/api'
import {isUITesting} from '@frogpond/launch-arguments'

import bundled from '../../../../docs/building-directory.json'
import {useForceBundledData} from '../../building-hours/dev/data-source-store'
import type {BuildingDirectory} from './types'

const bundledDirectories = (bundled as {data: Array<BuildingDirectory>}).data

/**
 * Every St. Olaf building's directory. UI tests and the dev override read
 * this repository's copy, as the Hours data does. The server's copy is
 * read otherwise. A card is whole without a directory, so a failed fetch
 * just leaves it out.
 */
export async function fetchDirectories(signal: AbortSignal): Promise<Array<BuildingDirectory>> {
	if (isUITesting || useForceBundledData.getState().forced) {
		return bundledDirectories
	}
	let response = await client.get('spaces/directory', {signal}).json()
	return (response as {data: Array<BuildingDirectory>}).data
}
