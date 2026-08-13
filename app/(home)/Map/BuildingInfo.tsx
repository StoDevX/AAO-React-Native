import * as React from 'react'
import {useLocalSearchParams, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {BuildingInfo} from '../../../source/features/map/building-info'
import {mapDataOptions} from '../../../source/features/map/query'
import {useMapSelection} from '../../../source/features/map/selection-context'

export default function BuildingInfoPage(): React.ReactNode {
	let router = useRouter()
	// The route param is the single source of truth for *this* screen; the
	// context exists so the map underneath can draw the marker.
	let {buildingId} = useLocalSearchParams<{buildingId?: string}>()
	let {clearSelectionOf} = useMapSelection()
	let {data: buildings = []} = useQuery(mapDataOptions)

	let building = React.useMemo(
		() => buildings.find((b) => b.id === buildingId),
		[buildings, buildingId],
	)

	// On unmount rather than only in the Close handler: the sheet is
	// swipe-dismissable, and that gesture pops the route without running any
	// handler -- which would otherwise strand the marker and the zoomed-in
	// camera on a building the user just dismissed.
	//
	// Scoped to this screen's own building, because tapping a second building
	// unmounts this screen after that tap has already selected its own.
	React.useEffect(() => {
		if (!buildingId) {
			return
		}
		return () => clearSelectionOf(buildingId)
	}, [buildingId, clearSelectionOf])

	let handleClose = React.useCallback(() => {
		router.back()
	}, [router])

	return <BuildingInfo building={building} onClose={handleClose} />
}
