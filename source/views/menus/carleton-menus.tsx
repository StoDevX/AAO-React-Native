import * as React from 'react'
import {TabBarIcon} from '@frogpond/navigation-tabs'
import {Platform, ScrollView, StyleSheet, View} from 'react-native'
import type {TopLevelViewPropsType} from '../types'
import {Row} from '@frogpond/layout'
import {ListRow, ListSeparator, Title} from '@frogpond/lists'
import {BonAppHostedMenu} from './menu-bonapp'

export const CarletonBurtonMenuScreen = ({
	navigation,
}: TopLevelViewPropsType) => (
	<BonAppHostedMenu
		cafe="burton"
		loadingMessage={['Searching for Schiller…']}
		name="Burton"
		navigation={navigation}
	/>
)
CarletonBurtonMenuScreen.navigationOptions = {
	title: 'Burton',
	tabBarIcon: TabBarIcon('menu'),
}

export const CarletonLDCMenuScreen = ({navigation}: TopLevelViewPropsType) => (
	<BonAppHostedMenu
		cafe="ldc"
		loadingMessage={['Tracking down empty seats…']}
		name="LDC"
		navigation={navigation}
	/>
)
CarletonLDCMenuScreen.navigationOptions = {
	title: 'LDC',
	tabBarIcon: TabBarIcon('menu'),
}

export const CarletonWeitzMenuScreen = ({
	navigation,
}: TopLevelViewPropsType) => (
	<BonAppHostedMenu
		cafe="weitz"
		loadingMessage={['Observing the artwork…', 'Previewing performances…']}
		name="Weitz Center"
		navigation={navigation}
	/>
)
CarletonWeitzMenuScreen.navigationOptions = {
	title: 'Weitz Center',
	tabBarIcon: TabBarIcon('menu'),
}

export const CarletonSaylesMenuScreen = ({
	navigation,
}: TopLevelViewPropsType) => (
	<BonAppHostedMenu
		cafe="sayles"
		loadingMessage={['Engaging in people-watching…', 'Checking the mail…']}
		name="Sayles Hill"
		navigation={navigation}
	/>
)
CarletonSaylesMenuScreen.navigationOptions = {
	title: 'Sayles Hill',
	tabBarIcon: TabBarIcon('menu'),
}

type Props = TopLevelViewPropsType

export function CarletonCafeIndex(props: Props) {
	let carletonCafes = [
		{id: 'CarletonBurtonMenuView', title: 'Burton'},
		{id: 'CarletonLDCMenuView', title: 'LDC'},
		{id: 'CarletonWeitzMenuView', title: 'Weitz Center'},
		{id: 'CarletonSaylesMenuView', title: 'Sayles Hill'},
	]

	return (
		<ScrollView style={styles.container}>
			{carletonCafes.map((loc: {id: string; title: string}, i, collection) => (
				<View key={i}>
					<ListRow
						arrowPosition="center"
						onPress={() => props.navigation.navigate(loc.id)}
					>
						<Row alignItems="center">
							<Title style={styles.rowText}>{loc.title}</Title>
						</Row>
					</ListRow>
					{i < collection.length - 1 ? (
						<ListSeparator spacing={{left: 15}} />
					) : null}
				</View>
			))}
		</ScrollView>
	)
}

const styles = StyleSheet.create({
	rowText: {
		paddingVertical: 6,
	},
	container: {
		paddingTop: Platform.OS === 'ios' ? 20 : 0,
	},
})
