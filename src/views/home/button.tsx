import React from 'react'
import {Platform, StyleSheet, Text, View} from 'react-native'
import {PlatformPressable} from '@react-navigation/elements'
import {Entypo, EntypoIconName} from '@react-native-vector-icons/entypo'
import {Link, LinkProps} from 'expo-router'
import {openUrl} from '@frogpond/open-url'

type CommonView = {
	title: string
	icon: EntypoIconName
	foreground: 'light' | 'dark'
	tint: string
	disabled?: boolean
}

export function HomeScreenButton({
	foreground,
	title,
	tint,
	icon,
	href,
}: LinkProps & CommonView): React.JSX.Element {
	let foregroundStyle =
		foreground === 'light' ? styles.lightForeground : styles.darkForeground

	return (
		<Link asChild={true} href={href} style={styles.button}>
			<PlatformPressable
				aria-label={title}
				role="button"
				style={{backgroundColor: tint}}
			>
				<View style={styles.contents}>
					<Entypo name={icon} size={32} style={foregroundStyle} />
					<Text style={foregroundStyle}>{title}</Text>
				</View>
			</PlatformPressable>
		</Link>
	)
}

export function HomeScreenLink({
	foreground,
	title,
	tint,
	icon,
	href,
}: CommonView & {href: `https://${string}`}): React.JSX.Element {
	let foregroundStyle =
		foreground === 'light' ? styles.lightForeground : styles.darkForeground

	return (
		<View style={styles.button}>
			<PlatformPressable
				aria-label={title}
				onPress={() => openUrl(href)}
				role="button"
				style={{backgroundColor: tint}}
			>
				<View style={styles.contents}>
					<Entypo name={icon} size={32} style={foregroundStyle} />
					<Text style={foregroundStyle}>{title}</Text>
				</View>
			</PlatformPressable>
		</View>
	)
}

const cellVerticalPadding = 8
const cellHorizontalPadding = 4

const styles = StyleSheet.create({
	button: {
		elevation: 2,
		borderRadius: Platform.OS === 'ios' ? 17 : 3,
		overflow: 'hidden',
		flex: 1,
		flexBasis: '40%',
	},
	contents: {
		alignItems: 'center',
		justifyContent: 'center',

		paddingTop: cellVerticalPadding,
		paddingBottom: cellVerticalPadding / 2,
		paddingHorizontal: cellHorizontalPadding,
	},
	lightForeground: {
		color: 'rgba(255, 255, 255, 0.9)',
	},
	darkForeground: {
		color: 'rgba(0, 0, 0, 0.65)',
	},
})
