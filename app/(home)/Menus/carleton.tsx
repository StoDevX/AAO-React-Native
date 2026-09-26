import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {useIsFocused, useRouter} from 'expo-router'

import {NavigationRow} from '../../../source/components/rows'
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
		<Host matchContents={false} style={styles.host}>
			<List modifiers={[listStyle('insetGrouped')]}>
				<Section>
					{carletonCafes.map((loc) => (
						<NavigationRow
							key={loc.href}
							onPress={() => router.navigate(loc.href)}
							title={loc.title}
						/>
					))}
				</Section>
			</List>
		</Host>
	)
}

const styles = StyleSheet.create({
	host: {
		flex: 1,
		backgroundColor: c.systemGroupedBackground,
	},
})
