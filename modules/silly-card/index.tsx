import * as React from 'react'
import {
	View,
	Text,
	StyleSheet,
	Platform,
	StyleProp,
	ViewStyle,
} from 'react-native'
import {material, iOSUIKit} from 'react-native-typography'
import * as c from '@frogpond/colors'

const cardStyles = StyleSheet.create({
	card: {
		marginHorizontal: 10,
		paddingHorizontal: 20,
		paddingBottom: 4,
		backgroundColor: c.tertiarySystemBackground,
		borderRadius: 12,
		elevation: 2,
	},
	title: {
		paddingTop: 8,
		paddingBottom: 6,
	},
	titleText: {
		...Platform.select({
			ios: iOSUIKit.title3Object,
			android: material.titleObject,
		}),
		color: c.label,
	},
	footerText: {
		...Platform.select({
			ios: iOSUIKit.footnoteObject,
			android: material.captionObject,
		}),
		color: c.secondaryLabel,
	},
	footer: {
		borderTopWidth: 1,
		borderTopColor: c.separator,
		paddingTop: 6,
		paddingBottom: 2,
	},
})

type Props = React.PropsWithChildren<{
	header?: false | string
	footer?: false | string
	style?: StyleProp<ViewStyle>
}>

export function Card({header, footer, children, style}: Props): JSX.Element {
	return (
		<View style={[cardStyles.card, style]}>
			{header ? (
				<View style={cardStyles.title}>
					<Text selectable={true} style={cardStyles.titleText}>
						{header}
					</Text>
				</View>
			) : null}

			<View>{children}</View>

			{footer ? (
				<View style={cardStyles.footer}>
					<Text selectable={true} style={cardStyles.footerText}>
						{footer}
					</Text>
				</View>
			) : null}
		</View>
	)
}
