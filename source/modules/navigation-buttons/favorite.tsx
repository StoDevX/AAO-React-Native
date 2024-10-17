import * as React from 'react'
import Ionicon from '@expo/vector-icons/Ionicons'
import {Touchable} from '../touchable'
import {rightButtonStyles as styles} from './styles'

type IoniconName = keyof typeof Ionicon.glyphMap

interface Props {
	onFavorite: () => unknown
	favorited: boolean
}

export function FavoriteButton(props: Props): React.JSX.Element {
	const icon = (
		props.favorited ? 'heart' : 'heart-outline'
	) satisfies IoniconName

	return (
		<Touchable
			highlight={false}
			onPress={props.onFavorite}
			style={styles.button}
		>
			<Ionicon name={icon} style={styles.icon} />
		</Touchable>
	)
}
