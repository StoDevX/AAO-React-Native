// @flow

import * as React from 'react'
import {View, Text, StyleSheet, Platform, Image} from 'react-native'
import Icon from 'react-native-vector-icons/Entypo'
import type {ViewType} from '../views'
import LinearGradient from 'react-native-linear-gradient'
import {Touchable} from '../components/touchable'
import * as c from '../components/colors'
import {iPhoneX} from '../components/device'
import {CELL_SIZE, CELL_MARGIN} from './button'
import {Row, Column} from '../components/layout'

type Props = {
	view: ViewType,
	onPress: () => any,
}

export function HomeScreenWidget({view, onPress, layout}: Props) {
	if (view.view.startsWith('/me/balances/')) {
		return <BalancesWidget view={view} layout={layout} />
	} else if (view.view.startsWith('/dictionary/term-of-the-day/')) {
		return <TermOfTheDayWidget view={view} layout={layout} />
	} else if (view.view.startsWith('/transit/upcoming/')) {
		return <UpcomingBusWidget view={view} layout={layout} />
	}

	return null
}

function Widget({view, children, layout}) {
	return (
		<Touchable
			accessibilityComponentType="button"
			accessibilityLabel={view.title}
			accessibilityTraits="button"
			highlight={false}
			onPress={view.onPress}
			style={[
				styles.widget,
				layout,
			]}
		>
			{children}
		</Touchable>
	)
}

function WidgetTitle({title, icon, border}) {
	return (
		<View style={[styles.titlebar, border && {borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.homescreenForegroundDark}]}>
			<View style={styles.iconWrapper}>
				<Icon name={icon} size={16} style={styles.icon} />
			</View>
			<Text style={styles.text} numberOfLines={1}>{title.toUpperCase()}</Text>
		</View>
	)
}

const BalancesWidget = ({view, layout}) => {
	return (
		<Widget view={view} layout={layout}>
			<WidgetTitle title={view.title} icon={view.icon} border={true} />
			<View style={[styles.content, {flexDirection: 'column', flex: 1}]}>
				<Row style={{flex: 1}}>
					<Column style={{flex: 1, alignItems: 'center', justifyContent: 'center', borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: c.homescreenForegroundDark, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.homescreenForegroundDark}}>
						<Text style={{fontSize: 18, fontWeight: '300'}}>$15.00</Text>
						<Text style={{fontWeight: '700', marginTop: 4}}>ole</Text>
					</Column>
					<Column style={{flex: 1, alignItems: 'center', justifyContent: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.homescreenForegroundDark}}>
						<Text style={{fontSize: 18, fontWeight: '300'}}>$200</Text>
						<Text style={{fontWeight: '700', marginTop: 4}}>flex</Text>
					</Column>
				</Row>
				<Row style={{flex: 1}}>
					<Column style={{flex: 1, alignItems: 'center', justifyContent: 'center', borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: c.homescreenForegroundDark}}>
						<Text style={{fontSize: 18, fontWeight: '300'}}>20 b/w</Text>
						<Text style={{fontSize: 18, fontWeight: '300'}}>6 color</Text>
						<Text style={{fontWeight: '700', marginTop: 4}}>printing</Text>
					</Column>
					<Column style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
						<Text style={{fontSize: 18, fontWeight: '300'}}>2 today</Text>
						<Text style={{fontSize: 18, fontWeight: '300'}}>6 weekly</Text>
						<Text style={{fontWeight: '700', marginTop: 4}}>meals</Text>
					</Column>
				</Row>
			</View>
		</Widget>
	)
}

const TermOfTheDayWidget = ({view, layout}) => {
	return (
		<Widget view={view} layout={layout}>
			<Image source={{uri: 'https://wp.stolaf.edu/sustainability/files/2012/10/turbine.jpg'}} style={[StyleSheet.absoluteFill, {borderRadius: borderRadius,}]} resizeMode="cover" />
			<WidgetTitle title={view.title} icon={view.icon} />
			<View style={[styles.content, {flex: 1, justifyContent: 'flex-end', padding: 8}]}>
				<Text style={{fontWeight: '800', fontSize: 28, color: c.homescreenForegroundLight}} numberOfLines={2}>Big Ole</Text>
			</View>
		</Widget>
	)
}

const UpcomingBusWidget = ({view, layout}) => {
	return (
		<Widget view={view} layout={layout}>
			<WidgetTitle title={view.title} icon={view.icon} />
			<View style={[styles.content]}>
				<Text>Bus</Text>
			</View>
		</Widget>
	)
}

const borderRadius = Platform.OS === 'ios' ? (iPhoneX ? 17 : 6) : 3

const styles = StyleSheet.create({
	widget: {
		borderRadius: borderRadius,
		backgroundColor: c.white,
		position: 'absolute',
		shadowColor: 'rgba(0,0,0,0.15)',
		shadowOffset: {width: 0, height: 2},
		shadowRadius: 4,
		shadowOpacity: 1,
	},
	titlebar: {
		flexDirection: 'row',
		padding: 4,
		alignItems: 'center',
		overflow: 'hidden',
	},
	iconWrapper: {
		backgroundColor: c.homescreenForegroundDark,
		borderRadius: 4,
		justifyContent: 'center',
		paddingVertical: 2,
		paddingHorizontal: 3,
	},
	icon: {
		color: c.homescreenForegroundLight,
	},
	text: {
		fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-condensed',
		fontSize: 14,
		marginLeft: 4,
		color: c.homescreenForegroundDark,
	},
	content: {},
	immersive: {},
})
