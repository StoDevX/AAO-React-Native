import * as React from 'react'
import {Platform, ScrollView, StyleSheet, View} from 'react-native'
import {Row} from '@frogpond/layout'
import {ListRow, ListSeparator, Title} from '@frogpond/lists'
import {BonAppHostedMenu} from './menu-bonapp'
import {useNavigation} from 'expo-router'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

export const CarletonBurtonMenuScreen = (): React.JSX.Element => (
	<BonAppHostedMenu
		cafe="burton"
		loadingMessage={['Searching for Schiller…']}
		name="Burton"
	/>
)

export const CarletonLDCMenuScreen = (): React.JSX.Element => (
	<BonAppHostedMenu
		cafe="ldc"
		loadingMessage={['Tracking down empty seats…']}
		name="LDC"
	/>
)

export const CarletonWeitzMenuScreen = (): React.JSX.Element => (
	<BonAppHostedMenu
		cafe="weitz"
		loadingMessage={['Observing the artwork…', 'Previewing performances…']}
		name="Weitz Center"
	/>
)

export const CarletonSaylesMenuScreen = (): React.JSX.Element => (
	<BonAppHostedMenu
		cafe="sayles"
		loadingMessage={['Engaging in people-watching…', 'Checking the mail…']}
		name="Sayles Hill"
	/>
)

export function CarletonCafeIndex(): React.JSX.Element {
	let navigation = useNavigation()
	type CarletonRoute =
		| 'menus/carleton-burton'
		| 'menus/carleton-ldc'
		| 'menus/carleton-weitz'
		| 'menus/carleton-sayles'

	let carletonCafes: Array<{href: CarletonRoute; title: string}> = [
		{href: 'menus/carleton-burton', title: 'Burton'},
		{href: 'menus/carleton-ldc', title: 'LDC'},
		{href: 'menus/carleton-weitz', title: 'Weitz Center'},
		{href: 'menus/carleton-sayles', title: 'Sayles Hill'},
	]

	return (
		<ScrollView style={styles.container}>
			{carletonCafes.map((loc, i, collection) => (
				<View key={i}>
					<ListRow
						arrowPosition="center"
						onPress={() => navigation.navigate(loc.href)}
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

export const BurtonNavigationOptions: NativeStackNavigationOptions = {
	title: 'Burton',
}

export const LDCNavigationOptions: NativeStackNavigationOptions = {
	title: 'LDC',
}

export const WeitzNavigationOptions: NativeStackNavigationOptions = {
	title: 'Weitz Center',
}

export const SaylesNavigationOptions: NativeStackNavigationOptions = {
	title: 'Sayles Hill',
}
