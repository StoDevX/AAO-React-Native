import * as React from 'react'
import {Platform, ScrollView, StyleSheet, View} from 'react-native'
import {Row} from '@frogpond/layout'
import {ListRow, ListSeparator, Title} from '@frogpond/lists'
import {useIsFocused, useRouter} from 'expo-router'

import {usePublishMenuHeader} from '../../../source/features/menus/menu-header'

export default function CarletonPage(): React.ReactNode {
	let router = useRouter()

	// A chooser rather than a menu: no day on it, no hours, and no meal to
	// pick. It publishes all the same, so the cafe tab the reader came from
	// does not leave its name and its live picker sitting over this list.
	usePublishMenuHeader(
		{
			name: 'Carleton',
			weekdayShort: null,
			weekdayLong: null,
			date: null,
			time: null,
			closed: false,
			reopening: null,
			loading: false,
			meals: null,
			filters: null,
		},
		useIsFocused(),
	)

	let carletonCafes = [
		{href: '/CarletonBurtonMenu', title: 'Burton'},
		{href: '/CarletonLDCMenu', title: 'LDC'},
		{href: '/CarletonWeitzMenu', title: 'Weitz Center'},
		{href: '/CarletonSaylesMenu', title: 'Sayles Hill'},
	] as const

	return (
		<ScrollView contentInsetAdjustmentBehavior="automatic" style={styles.container}>
			{carletonCafes.map((loc, i, collection) => (
				<View key={loc.href}>
					<ListRow arrowPosition="center" onPress={() => router.navigate(loc.href)}>
						<Row alignItems="center">
							<Title style={styles.rowText}>{loc.title}</Title>
						</Row>
					</ListRow>
					{i < collection.length - 1 ? <ListSeparator spacing={{left: 15}} /> : null}
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
