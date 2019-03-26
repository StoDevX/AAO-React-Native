// @flow

import * as React from 'react'
import {Icon, platformPrefixIconName} from '@frogpond/icon'
import {Touchable} from '@frogpond/touchable'
import {rightButtonStyles as styles} from './styles'

type Props = {
	onPress: () => any,
}

export function ShareButton(props: Props) {
	return (
		<Touchable highlight={false} onPress={props.onPress} style={styles.button}>
			<Icon name={platformPrefixIconName('share')} style={styles.icon} />
		</Touchable>
	)
}
