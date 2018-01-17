// @flow
import * as React from 'react'
import {TabBarIcon} from '../components/tabbar-icon'
import {View, Platform, ScrollView, StyleSheet} from 'react-native'
import type {TopLevelViewPropsType} from '../types'
import {Row} from '../components/layout'
import {ListRow, ListSeparator, Title} from '../components/list'
import {BonAppHostedMenu} from './menu-bonapp'

export const CarletonBurtonMenuScreen = ({
	navigation,
}: TopLevelViewPropsType) => (
	<BonAppHostedMenu
		cafeId="35"
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
		cafeId="36"
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
		cafeId="458"
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
		cafeId="34"
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

export class CarletonCafeIndex extends React.Component<Props> {
	render() {
		const carletonCafes = [
			{id: 'CarletonBurtonMenuView', title: 'Burton'},
			{id: 'CarletonLDCMenuView', title: 'LDC'},
			{id: 'CarletonWeitzMenuView', title: 'Weitz Center'},
			{id: 'CarletonSaylesMenuView', title: 'Sayles Hill'},
		]

		return (
			<ScrollView style={styles.container}>
				{carletonCafes.map(
					(loc: {id: string, title: string}, i, collection) => (
						<View key={i}>
							<ListRow
								arrowPosition="center"
								onPress={() => this.props.navigation.navigate(loc.id)}
							>
								<Row alignItems="center">
									<Title style={styles.rowText}>{loc.title}</Title>
								</Row>
							</ListRow>
							{i < collection.length - 1 ? (
								<ListSeparator spacing={{left: 15}} />
							) : null}
						</View>
					),
				)}
			</ScrollView>
		)
	}
}

const styles = StyleSheet.create({
	rowText: {
		paddingVertical: 6,
	},
	container: {
		paddingTop: Platform.OS === 'ios' ? 20 : 0,
	},
})
