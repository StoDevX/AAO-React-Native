import * as React from 'react'

import {Icon, platformPrefixIconName} from '@frogpond/icon'
import {Touchable, TouchableProps} from '@frogpond/touchable'

import {rightButtonStyles as styles} from './styles'

export function ShareButton(
	props: Pick<TouchableProps, 'onPress'>,
): JSX.Element {
	return (
		<Touchable highlight={false} onPress={props.onPress} style={styles.button}>
			<Icon
				name={platformPrefixIconName('share-outline')}
				style={styles.icon}
			/>
		</Touchable>
	)
}
