import * as React from 'react'

import {StyleSheet} from 'react-native'
import {Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {Stack, useRouter} from 'expo-router'

import {DisclosureRow} from '../../../source/components/rows'

const LIBRARIES = [
	{title: 'Badges', route: '/developer/component-library/badges'},
	{title: 'Buttons', route: '/developer/component-library/buttons'},
	{title: 'Colors', route: '/developer/component-library/colors'},
	{title: 'Context Menus', route: '/developer/component-library/context-menus'},
	{title: 'FAQ Banners', route: '/developer/component-library/faq-banners'},
	{title: 'Rows', route: '/developer/component-library/rows'},
] as const

export default function ComponentLibraryRootPage(): React.ReactNode {
	const router = useRouter()

	return (
		<>
			<Stack.Title>Component Library</Stack.Title>

			<Host style={styles.host}>
				<List modifiers={[listStyle('insetGrouped')]}>
					<Section>
						{LIBRARIES.map((library) => (
							<DisclosureRow
								key={library.route}
								onPress={() => router.navigate(library.route)}
								title={library.title}
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
