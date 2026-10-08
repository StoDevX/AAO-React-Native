import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {Stack, useRouter} from 'expo-router'

import {NavigationRow} from '../source/components/rows'
import {CARLETON_CAFES} from '../source/features/menus/carleton-cafes'

/**
 * Carleton's Menus tile: its dining halls alone, without the St. Olaf cafés'
 * tabs the Menus screen carries.
 */
export default function CarletonMenusPage(): React.ReactNode {
	let router = useRouter()

	return (
		<>
			<Stack.Title>Menus</Stack.Title>
			<Host matchContents={false} style={styles.host}>
				<List modifiers={[listStyle('insetGrouped')]}>
					<Section>
						{CARLETON_CAFES.map((cafe) => (
							<NavigationRow
								key={cafe.href}
								onPress={() => router.navigate(cafe.href)}
								title={cafe.title}
							/>
						))}
					</Section>
				</List>
			</Host>
		</>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
