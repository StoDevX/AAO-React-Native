import * as React from 'react'
import {Stack, useLocalSearchParams, useRouter} from 'expo-router'
import {useQuery} from '@tanstack/react-query'

import {BuildingInfo} from '../../../source/features/map/building-info'
import {mapDataOptions} from '../../../source/features/map/query'
import {useMapSelection} from '../../../source/features/map/selection-context'

export default function BuildingInfoPage(): React.ReactNode {
	let router = useRouter()
	// The route param is the single source of truth for *this* screen; the
	// context exists so the map underneath can draw the marker.
	let {buildingId} = useLocalSearchParams<{buildingId?: string}>()
	let {clearSelection} = useMapSelection()
	let {data: buildings = []} = useQuery(mapDataOptions)

	let building = React.useMemo(
		() => buildings.find((b) => b.id === buildingId),
		[buildings, buildingId],
	)

	// On unmount rather than in a close handler: the sheet is
	// swipe-dismissable, and that gesture pops the route without running any
	// handler -- which would otherwise strand the marker and the zoomed-in
	// camera on a building the user just dismissed.
	React.useEffect(() => clearSelection, [clearSelection])

	return (
		<>
			<Stack.Title>{building?.properties.name ?? 'Building'}</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close"
					icon="xmark"
					onPress={() => router.back()}
				/>
			</Stack.Toolbar>

			<BuildingInfo building={building} />
		</>
	)
}
