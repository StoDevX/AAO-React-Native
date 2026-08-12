import * as React from 'react'
import {Platform, ScrollView, StyleSheet, View} from 'react-native'
import {Row} from '@frogpond/layout'
import {ListRow, ListSeparator, Title} from '@frogpond/lists'
import {useRouter} from 'expo-router'

export default function CarletonPage(): React.ReactNode {
	let router = useRouter()

	let carletonCafes = [
		{href: '/CarletonBurtonMenu', title: 'Burton'},
		{href: '/CarletonLDCMenu', title: 'LDC'},
		{href: '/CarletonWeitzMenu', title: 'Weitz Center'},
		{href: '/CarletonSaylesMenu', title: 'Sayles Hill'},
	] as const

	return (
		<ScrollView
			contentInsetAdjustmentBehavior="automatic"
			style={styles.container}
		>
			{carletonCafes.map((loc, i, collection) => (
				<View key={i}>
					<ListRow arrowPosition="center" onPress={() => router.push(loc.href)}>
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
