import buildingDirectory from '../../../docs/building-directory.json'
import buildingHours from '../../../docs/building-hours.json'
import type {BuildingType} from '../../features/building-hours/types'
import type {BuildingDirectory} from '../../features/map/directory/types'

/** This repository's copy of St. Olaf's venues, as `bundle-data` publishes it. */
export const BUNDLED_HOURS: ReadonlyArray<BuildingType> = (buildingHours as {data: BuildingType[]})
	.data

/** This repository's copy of St. Olaf's building directories. */
export const BUNDLED_DIRECTORIES: ReadonlyArray<BuildingDirectory> = (
	buildingDirectory as {data: BuildingDirectory[]}
).data
