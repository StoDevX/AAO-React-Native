import * as React from 'react'
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import * as c from '@frogpond/colors'
import {SymbolView} from 'expo-symbols'

const arrowStyles = StyleSheet.create({
	wrapper: {
		marginLeft: 10,
	},
})

export function DisclosureArrow({style}: {style?: StyleProp<ViewStyle>}): React.ReactNode {
	return (
		<View style={[arrowStyles.wrapper, style]}>
			<SymbolView name="chevron.right" size={20} tintColor={c.secondaryLabel} />
		</View>
	)
}
