import * as React from 'react'
import {Alert, StyleSheet} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {Touchable} from '@frogpond/touchable'
import * as c from '@frogpond/colors'
import {rightButtonStyles as styles} from './styles'

export const debugStyles = StyleSheet.create({
	debugButton: {
		color: c.link,
	},
})

type Props = {
	shouldShow: boolean
}

export const DebugNoticeButton = function (props: Props): JSX.Element {
	if (!props.shouldShow) {
		return <></>
	}

	return (
		<Touchable
			highlight={false}
			onPress={() => {
				Alert.alert('Debug notice', 'This view is showing mocked data.')
			}}
			style={styles.button}
		>
			<Icon name="bug" style={[styles.icon, debugStyles.debugButton]} />
		</Touchable>
	)
}
