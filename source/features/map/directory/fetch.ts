import {clientFor} from '@frogpond/api'

import {campusById, type CampusId} from '../../../campuses'
import {useForceBundledData} from '../../building-hours/dev/data-source-store'
import {sectionServer} from '../../campus/section-server'
import type {BuildingDirectory} from './types'

/**
 * Every building's directory on `campus`. The dev override reads the
 * campus's bundled copy, as the Hours data does, where it has one. The server's copy is read otherwise. A card is whole without a
 * directory, so a failed fetch just leaves it out.
 */
export async function fetchDirectories(
	campus: CampusId,
	signal: AbortSignal,
): Promise<Array<BuildingDirectory>> {
	let map = campusById(campus).map
	let bundled = map?.buildingDirectory?.bundled
	if (bundled && useForceBundledData.getState().forced) {
		return [...bundled]
	}
	let response = await clientFor(sectionServer(campus, map))
		.get('spaces/directory', {signal})
		.json()
	return (response as {data: Array<BuildingDirectory>}).data
}
