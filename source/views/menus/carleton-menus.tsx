import * as React from 'react'
import {TabBarIcon} from '@frogpond/navigation-tabs'
import {Platform, ScrollView, StyleSheet, View} from 'react-native'
import {Row} from '@frogpond/layout'
import {ListRow, ListSeparator, Title} from '@frogpond/lists'
import {BonAppHostedMenu} from './menu-bonapp'
import {useNavigation} from '@react-navigation/native'
import {RootStackParamList} from '../../navigation/types'

export const CarletonBurtonMenuScreen = (): JSX.Element => (
	<BonAppHostedMenu
		cafe="burton"
		loadingMessage={['Searching for Schiller…']}
		name="Burton"
	/>
)
CarletonBurtonMenuScreen.navigationOptions = {
	title: 'Burton',
	tabBarIcon: TabBarIcon('menu'),
}

export const CarletonLDCMenuScreen = (): JSX.Element => (
	<BonAppHostedMenu
		cafe="ldc"
		loadingMessage={['Tracking down empty seats…']}
		name="LDC"
	/>
)
CarletonLDCMenuScreen.navigationOptions = {
	title: 'LDC',
	tabBarIcon: TabBarIcon('menu'),
}

export const CarletonWeitzMenuScreen = (): JSX.Element => (
	<BonAppHostedMenu
		cafe="weitz"
		loadingMessage={['Observing the artwork…', 'Previewing performances…']}
		name="Weitz Center"
	/>
)
CarletonWeitzMenuScreen.navigationOptions = {
	title: 'Weitz Center',
	tabBarIcon: TabBarIcon('menu'),
}

export const CarletonSaylesMenuScreen = (): JSX.Element => (
	<BonAppHostedMenu
		cafe="sayles"
		loadingMessage={['Engaging in people-watching…', 'Checking the mail…']}
		name="Sayles Hill"
	/>
)
CarletonSaylesMenuScreen.navigationOptions = {
	title: 'Sayles Hill',
	tabBarIcon: TabBarIcon('menu'),
}

export function CarletonCafeIndex(): JSX.Element {
	let navigation = useNavigation()

	let carletonCafes: Array<{id: keyof RootStackParamList; title: string}> = [
		{id: 'CarletonBurtonMenu', title: 'Burton'},
		{id: 'CarletonLDCMenu', title: 'LDC'},
		{id: 'CarletonWeitzMenu', title: 'Weitz Center'},
		{id: 'CarletonSaylesMenu', title: 'Sayles Hill'},
	]

	return (
		<ScrollView style={styles.container}>
			{carletonCafes.map(
				(loc: {id: keyof RootStackParamList; title: string}, i, collection) => (
					<View key={i}>
						<ListRow
							arrowPosition="center"
							onPress={() => navigation.navigate(loc.id)}
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

const styles = StyleSheet.create({
	rowText: {
		paddingVertical: 6,
	},
	container: {
		paddingTop: Platform.OS === 'ios' ? 20 : 0,
	},
})
