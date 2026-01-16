import * as React from 'react'
import {Ionicons} from '@react-native-vector-icons/ionicons'
import {Touchable, TouchableProps} from '@frogpond/touchable'
import {rightButtonStyles as styles} from './styles'

export function ShareButton(
	props: Pick<TouchableProps, 'onPress'>,
): React.JSX.Element {
	return (
		<Touchable highlight={false} onPress={props.onPress} style={styles.button}>
			<Ionicons name="share-outline" style={styles.icon} />
		</Touchable>
	)
}
