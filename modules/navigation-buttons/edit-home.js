// @flow

import * as React from 'react'
import {Text} from 'react-native'
import {Touchable} from '@frogpond/touchable'
import type {NavigationScreenProp} from 'react-navigation'
import {commonStyles} from './styles'

type Props = {
	navigation: NavigationScreenProp<*>,
	buttonStyle?: any,
}

export function EditHomeButton({navigation, buttonStyle}: Props) {
	return (
		<Touchable
			accessibilityLabel="Open Edit Home"
			accessibilityRole="button"
			accessible={true}
			borderless={true}
			highlight={false}
			onPress={() => navigation.navigate('EditHomeView')}
			style={[commonStyles.button, buttonStyle]}
			testID="button-open-edit-home"
		>
			<Text style={commonStyles.text}>Edit</Text>
		</Touchable>
	)
}
