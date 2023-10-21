import * as React from 'react'

import {FavoriteButton} from '@frogpond/navigation-buttons'

import {useAppDispatch, useAppSelector} from '../../../redux'
import {
	selectFavoriteBuildings,
	toggleFavoriteBuilding,
} from '../../../redux/parts/buildings'

type Props = {
	buildingName: string
}

export const BuildingFavoriteButton = function (props: Props): JSX.Element {
	let dispatch = useAppDispatch()
	let favorites = useAppSelector(selectFavoriteBuildings)

	let {buildingName} = props

	let onFavorite = React.useCallback(
		() => dispatch(toggleFavoriteBuilding(buildingName)),
		[dispatch, buildingName],
	)

	let favorited = favorites.includes(buildingName)

	return <FavoriteButton favorited={favorited} onFavorite={onFavorite} />
}
