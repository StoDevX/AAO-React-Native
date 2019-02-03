// @flow

import * as React from 'react'
import {Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {Touchable} from '@frogpond/touchable'
import {rightButtonStyles as styles} from './styles'

type Props = {
	onFavorite: () => mixed,
	favorited: boolean,
}

// (ios|md)-heart(|-empty)
const filled = `${Platform.OS === 'ios' ? 'ios' : 'md'}-heart`
const outlined = `${filled}-empty`

export function FavoriteButton(props: Props) {
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
