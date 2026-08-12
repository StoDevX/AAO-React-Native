import * as React from 'react'
import {useLocalSearchParams, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {BuildingInfo} from '../../../source/features/map/building-info'
import {mapDataOptions} from '../../../source/features/map/query'
import {useMapSelection} from '../../../source/features/map/selection-context'

export default function BuildingInfoPage(): React.ReactNode {
	let router = useRouter()
	let {buildingId} = useLocalSearchParams<{buildingId?: string}>()
	let {selectedBuildingId, clearSelection} = useMapSelection()
	let {data: buildings = []} = useQuery(mapDataOptions)

	let id = selectedBuildingId ?? buildingId ?? null
	let building = React.useMemo(
		() => buildings.find((b) => b.id === id),
		[buildings, id],
	)

	let handleClose = React.useCallback(() => {
		clearSelection()
		router.back()
	}, [clearSelection, router])

	return <BuildingInfo building={building} onClose={handleClose} />
}
