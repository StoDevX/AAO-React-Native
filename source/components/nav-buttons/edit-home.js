/**
 * @flow
 * Exports a button that opens the Edit Home screen
 */

import * as React from 'react'
import {Text} from 'react-native'
import {Touchable} from '../touchable'
import type {NavType} from '../../views/types'
import {commonStyles} from './styles'

export function EditHomeButton({
	navigation,
	buttonStyle,
}: {
	navigation: NavType,
	buttonStyle?: any,
}) {
	return (
		<Touchable
			accessibilityComponentType="button"
			accessibilityLabel="Open Edit Home"
			accessibilityTraits="button"
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
