import React from 'react'
import {useNavigation} from '@react-navigation/native'
import {useDispatch, useSelector} from 'react-redux'
import {ContextMenu} from '@frogpond/context-menu'
import {openUrl} from '@frogpond/open-url'

import type {ViewType} from '../views'
import {HomeScreenButton} from './button'
import {TILE_SIZES, type TileSize} from './types'
import {
	selectHomescreenSize,
	setHomescreenTileSize,
} from '../../redux/parts/settings'

const TILE_SIZE_LABELS: Record<TileSize, string> = {
	'1x1': 'Small',
	'1x2': 'Medium',
	'2x2': 'Large',
	'2x4': 'Wide',
}

const SIZE_ACTIONS: Array<{key: TileSize; title: string}> = TILE_SIZES.map(
	(size) => ({key: size, title: TILE_SIZE_LABELS[size]}),
)

type Props = {
	view: ViewType
}

export function HomeScreenTile({view}: Props): React.ReactElement {
	const navigation = useNavigation()
	const dispatch = useDispatch()
	const size = useSelector(selectHomescreenSize(view.id))

	const onPress = React.useCallback(() => {
		if (view.type === 'url' || view.type === 'browser-url') {
			openUrl(view.url)
		} else if (view.type === 'view') {
			;(navigation.navigate as (route: string) => void)(view.view)
		} else {
			throw new Error(`unexpected view type ${(view as ViewType).type}`)
		}
	}, [navigation, view])

	const onPressMenuItem = React.useCallback(
		(key: string) => {
			if ((TILE_SIZES as readonly string[]).includes(key)) {
				dispatch(setHomescreenTileSize({id: view.id, size: key as TileSize}))
			}
		},
		[dispatch, view.id],
	)

	return (
		<ContextMenu
			actions={SIZE_ACTIONS}
			selectedAction={size}
			onPress={onPress}
			onPressMenuItem={onPressMenuItem}
			title="Tile size"
			testID={`home-tile-${view.id}`}
		>
			<HomeScreenButton view={view} size={size} onPress={onPress} />
		</ContextMenu>
	)
}
