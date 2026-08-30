import * as React from 'react'

import {TableView, Section} from '@frogpond/tableview'
import {PushButtonCell} from '@frogpond/tableview/cells'
import {Stack, useRouter} from 'expo-router'

// This file is named ComponentLibrary.tsx (not index.tsx) so it doesn't
// claim the bare `/` route -- (component-library) is a top-level group,
// a sibling of (home), so an index.tsx here would collide with
// app/(home)/index.tsx for the unqualified `/` path. This screen is
// reachable at /ComponentLibrary. PR 8's developer.tsx entry point must
// push to '/ComponentLibrary', not '/(component-library)' or '/'.
export default function ComponentLibraryRootPage(): React.ReactNode {
	const router = useRouter()

	return (
		<>
			<Stack.Title>Component Library</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => router.back()}
				/>
			</Stack.Toolbar>

			<TableView>
				<Section>
					<PushButtonCell
						onPress={() => router.navigate('/(component-library)/BadgeLibrary')}
						title="Badges"
					/>
					<PushButtonCell
						onPress={() => router.navigate('/(component-library)/ButtonLibrary')}
						title="Buttons"
					/>
					<PushButtonCell
						onPress={() => router.navigate('/(component-library)/ColorsLibrary')}
						title="Colors"
					/>
					<PushButtonCell
						onPress={() => router.navigate('/(component-library)/ContextMenuLibrary')}
						title="Context Menus"
					/>
					<PushButtonCell
						onPress={() => router.navigate('/(component-library)/FaqBannerLibrary')}
						title="FAQ Banners"
					/>
				</Section>
			</TableView>
		</>
	)
}
