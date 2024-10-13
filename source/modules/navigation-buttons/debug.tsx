import * as React from 'react'
import {Alert, StyleSheet} from 'react-native'
import Ionicon from '@expo/vector-icons/Ionicons'
import {Touchable} from '../touchable'
import * as c from '../colors'
import {rightButtonStyles as styles} from './styles'

export const debugStyles = StyleSheet.create({
	debugButton: {
		color: c.link,
	},
})

interface Props {
	shouldShow: boolean
}

export const DebugNoticeButton = function (props: Props): React.JSX.Element {
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
			<Ionicon name="bug" style={[styles.icon, debugStyles.debugButton]} />
		</Touchable>
	)
}
