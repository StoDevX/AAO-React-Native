import * as React from 'react'
import {Ionicons} from '@react-native-vector-icons/ionicons'
import {Touchable} from '@frogpond/touchable'
import {rightButtonStyles as styles} from './styles'

type Props = {
	onFavorite: () => unknown
	favorited: boolean
}

export function FavoriteButton(props: Props): React.JSX.Element {
	return (
		<Touchable
			highlight={false}
			onPress={props.onFavorite}
			style={styles.button}
		>
			<Ionicons
				name={props.favorited ? 'heart' : 'heart-outline'}
				style={styles.icon}
			/>
		</Touchable>
	)
}
