import {client} from '@frogpond/api'
import {isUITesting} from '@frogpond/launch-arguments'

import bundled from '../../../../docs/building-directory.json'
import {useForceBundledData} from '../../building-hours/dev/data-source-store'
import type {BuildingDirectory} from './types'

const bundledDirectories = (bundled as {data: Array<BuildingDirectory>}).data

/**
 * Every St. Olaf building's directory. UI tests and the dev override read
 * this repository's copy, as the Hours data does. The server's copy is
 * preferred otherwise, and the bundled one stands in when it cannot be had:
 * the route is newer than the app, and a card is whole without a directory.
 */
export async function fetchDirectories(signal: AbortSignal): Promise<Array<BuildingDirectory>> {
	if (isUITesting || useForceBundledData.getState().forced) {
		return bundledDirectories
	}
	try {
		let response = await client.get('spaces/directory', {signal}).json()
		return (response as {data: Array<BuildingDirectory>}).data
	} catch {
		return bundledDirectories
	}
}
