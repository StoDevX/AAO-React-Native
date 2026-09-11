import * as React from 'react'

import {StyleSheet} from 'react-native'
import {Host, List, Section} from '@expo/ui/swift-ui'
import {listStyle} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {Stack, useNavigation, useRouter} from 'expo-router'

import {DisclosureRow} from '../../source/components/rows'

// This file is named ComponentLibrary.tsx (not index.tsx) so it doesn't
// claim the bare `/` route -- (component-library) is a top-level group,
// a sibling of (home), so an index.tsx here would collide with
// app/(home)/index.tsx for the unqualified `/` path. This screen is
// reachable at /ComponentLibrary. PR 8's developer.tsx entry point must
// push to '/ComponentLibrary', not '/(component-library)' or '/'.
const LIBRARIES = [
	{title: 'Badges', route: '/(component-library)/BadgeLibrary'},
	{title: 'Buttons', route: '/(component-library)/ButtonLibrary'},
	{title: 'Colors', route: '/(component-library)/ColorsLibrary'},
	{title: 'Context Menus', route: '/(component-library)/ContextMenuLibrary'},
	{title: 'FAQ Banners', route: '/(component-library)/FaqBannerLibrary'},
] as const

export default function ComponentLibraryRootPage(): React.ReactNode {
	const router = useRouter()
	const navigation = useNavigation()

	return (
		<>
			<Stack.Title>Component Library</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

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
