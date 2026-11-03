import {clientFor} from '@frogpond/api'

import {campusById, type CampusId} from '../../../campuses'
import {sectionServer} from '../../campus/section-server'
import type {BuildingDirectory} from './types'

/**
 * Every building's directory on `campus`, from its server. A card is whole without a
 * directory, so a failed fetch just leaves it out.
 */
export async function fetchDirectories(
	campus: CampusId,
	signal: AbortSignal,
): Promise<Array<BuildingDirectory>> {
	let map = campusById(campus).map
	let response = await clientFor(sectionServer(campus, map))
		.get('spaces/directory', {signal})
		.json()
	return (response as {data: Array<BuildingDirectory>}).data
}
