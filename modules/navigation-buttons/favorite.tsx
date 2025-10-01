import * as React from 'react'
import {Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {Touchable} from '@frogpond/touchable'
import {rightButtonStyles as styles} from './styles'
import {platformPrefixIconName} from '../icon/platform-prefix-icon-name'

type Props = {
	onFavorite: () => unknown
	favorited: boolean
}

const filled = platformPrefixIconName('heart')
const outlined = platformPrefixIconName('heart-outline')

export function FavoriteButton(props: Props): JSX.Element {
	const icon = props.favorited ? filled : outlined

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
