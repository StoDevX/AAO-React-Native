import * as React from 'react'
import {useRouter} from 'expo-router'

import {BuildingPicker} from '../../../source/features/map/building-picker'
import {useMapSelection} from '../../../source/features/map/selection-context'

export default function BuildingPickerPage(): React.ReactNode {
	let router = useRouter()
	let {selectBuilding} = useMapSelection()

	let handleSelect = React.useCallback(
		(id: string) => {
			selectBuilding(id)
			// `replace`, so closing the info card returns to the map rather than
			// to a picker whose scroll position and search text are stale.
			router.replace({
				pathname: '/Map/BuildingInfo',
				params: {buildingId: id},
			})
		},
		[router, selectBuilding],
	)

	return <BuildingPicker onSelect={handleSelect} />
}
