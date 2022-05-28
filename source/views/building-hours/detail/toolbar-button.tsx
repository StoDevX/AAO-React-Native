import * as React from 'react'
import {FavoriteButton} from '@frogpond/navigation-buttons'
import type {ReduxState} from '../../../redux'
import {useSelector, useDispatch} from 'react-redux'
import {toggleFavoriteBuilding} from '../../../redux/parts/buildings'

type Props = {
	buildingName: string
}

export const BuildingFavoriteButton = function (props: Props): JSX.Element {
	let dispatch = useDispatch()
	let favorites = useSelector(
		(state: ReduxState) => state.buildings?.favorites || [],
	)

	let {buildingName} = props

	let onFavorite = React.useCallback(
		() => dispatch(toggleFavoriteBuilding(buildingName)),
		[dispatch, buildingName],
	)

	let favorited = favorites.includes(buildingName)

	return <FavoriteButton favorited={favorited} onFavorite={onFavorite} />
}
