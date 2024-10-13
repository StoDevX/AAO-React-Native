import * as React from 'react'
import Ionicon from '@expo/vector-icons/Ionicons'
import {Touchable, TouchableProps} from '../touchable'
import {rightButtonStyles as styles} from './styles'

export function ShareButton(
	props: Pick<TouchableProps, 'onPress'>,
): React.JSX.Element {
	return (
		<Touchable highlight={false} onPress={props.onPress} style={styles.button}>
			<Ionicon name="share-outline" style={styles.icon} />
		</Touchable>
	)
}
