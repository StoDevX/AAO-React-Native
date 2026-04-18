import * as React from 'react'
import {Ionicons as Icon} from '@react-native-vector-icons/ionicons'
import {Touchable} from '@frogpond/touchable'
import {rightButtonStyles as styles} from './styles'

type Props = {
	onFavorite: () => unknown
	favorited: boolean
}

export function FavoriteButton(props: Props): React.ReactNode {
	const icon = props.favorited ? 'heart' : 'heart-outline'

	return (
		<Touchable
			highlight={false}
			onPress={props.onFavorite}
			style={styles.button}
		>
			<Icon name={icon} style={styles.icon} />
		</Touchable>
	)
}
