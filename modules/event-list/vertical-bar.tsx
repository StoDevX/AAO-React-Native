import * as React from 'react'
import {Platform, StyleProp, StyleSheet, View, ViewStyle} from 'react-native'
import * as c from '@frogpond/colors'
import {useTheme} from '@frogpond/app-theme'

const dotBarStyles = StyleSheet.create({
	diagram: {
		marginTop: 9,
		marginBottom: 8,
		flexDirection: 'column',
		alignItems: 'center',
	},
	circle: {
		height: 5,
		width: 5,
		borderRadius: 5,
	},
	line: {
		width: 1,
		flex: 1,
	},
})

type Props = {
	style?: StyleProp<ViewStyle>
}

function DottedBar({style}: Props) {
	const { colors } = useTheme();
	let background = {backgroundColor: colors.primary}

	return (
		<View style={[dotBarStyles.diagram, style]}>
			<View style={[background, dotBarStyles.circle]} />
			<View style={[background, dotBarStyles.line]} />
			<View style={[background, dotBarStyles.circle]} />
		</View>
	)
}

const solidBarStyles = StyleSheet.create({
	border: {
		width: 1.5,
		backgroundColor: c.black75Percent,
	},
})

function SolidBar({style}: Props) {
	return <View style={[solidBarStyles.border, style]} />
}

export function Bar(props: Props): JSX.Element {
	switch (Platform.OS) {
		case 'ios':
			return <SolidBar {...props} />
		case 'android':
			return <DottedBar {...props} />
		default:
			return <SolidBar {...props} />
	}
}
