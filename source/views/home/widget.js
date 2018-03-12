// @flow

import * as React from 'react'
import {View, Text, StyleSheet, Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Entypo'
import type {ViewType} from '../views'
import LinearGradient from 'react-native-linear-gradient'
import {Touchable} from '../components/touchable'
import * as c from '../components/colors'
import {iPhoneX} from '../components/device'
import {CELL_SIZE, CELL_MARGIN} from './button'

type Props = {
	view: ViewType,
	onPress: () => any,
}

export function HomeScreenWidget({view, onPress}: Props) {
	if (view.view.startsWith('/me/balances/')) {
		return <BalancesWidget view={view} />
	} else if (view.view.startsWith('/dictionary/term-of-the-day/')) {
		return <TermOfTheDayWidget view={view} />
	} else if (view.view.startsWith('/transit/upcoming/')) {
		return <UpcomingBusWidget view={view} />
	}

	return null
}

function Widget({view, children}) {
	return (
		<Touchable
			accessibilityComponentType="button"
			accessibilityLabel={view.title}
			accessibilityTraits="button"
			highlight={false}
			onPress={view.onPress}
			style={[
				styles.widget,
				{
					width: CELL_SIZE * view.size.width + CELL_MARGIN,
					height: CELL_SIZE * view.size.height + CELL_MARGIN,
				},
			]}
		>
			{children}
		</Touchable>
	)
}

function WidgetTitle({title, icon}) {
	const foreground = styles.darkForeground

	return (
		<View style={styles.titlebar}>
			<Icon name={icon} size={12} style={[foreground, styles.icon]} />
			<Text style={[foreground, styles.text]}>{title.toUpperCase()}</Text>
		</View>
	)
}

const BalancesWidget = ({view}) => {
	return (
		<Widget view={view}>
			<WidgetTitle title={view.title} icon={view.icon} />
			<View style={[styles.content]}>
				<Text>Balances</Text>
			</View>
		</Widget>
	)
}

const TermOfTheDayWidget = ({view}) => {
	return (
		<Widget view={view}>
			<WidgetTitle title={view.title} icon={view.icon} />
			<View style={[styles.content, styles.immersive]}>
				<Text>Term of the Day</Text>
			</View>
		</Widget>
	)
}

const UpcomingBusWidget = ({view}) => {
	return (
		<Widget view={view}>
			<WidgetTitle title={view.title} icon={view.icon} />
			<View style={[styles.content]}>
				<Text>Bus</Text>
			</View>
		</Widget>
	)
}

const styles = StyleSheet.create({
	widget: {
		borderRadius: Platform.OS === 'ios' ? (iPhoneX ? 17 : 6) : 3,
		width: CELL_SIZE,
		height: CELL_SIZE,
		flex: 1,
		backgroundColor: c.white,
	},
	titlebar: {
		flexDirection: 'row',
	},
	icon: {
		backgroundColor: c.transparent,
	},
	text: {
		backgroundColor: c.transparent,
		fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
		fontSize: 14,
	},
	lightForeground: {
		color: c.homescreenForegroundLight,
	},
	darkForeground: {
		color: c.homescreenForegroundDark,
	},
	content: {},
	immersive: {},
})
