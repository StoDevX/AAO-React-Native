import * as React from 'react'
import {Platform, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import * as c from '@frogpond/colors'
import {SymbolView} from 'expo-symbols'

const arrowStyles = StyleSheet.create({
	wrapper: {
		marginLeft: 10,
	},
})

/**
 * iOS's disclosure chevron, trailing a row that pushes another screen. Android
 * draws none: a Material list item navigates without one.
 */
export function DisclosureArrow({style}: {style?: StyleProp<ViewStyle>}): React.ReactNode {
	if (Platform.OS === 'android') {
		return null
	}
	return (
		<View style={[arrowStyles.wrapper, style]}>
			<SymbolView
				name={{ios: 'chevron.right', android: 'chevron_right'}}
				size={20}
				tintColor={c.secondaryLabel}
			/>
		</View>
	)
}
