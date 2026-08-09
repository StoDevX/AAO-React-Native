import React from 'react'

import {TableView, Section} from '@frogpond/tableview'
import {PushButtonCell} from '@frogpond/tableview/cells'
import {Stack, useRouter} from 'expo-router'

export const ComponentLibrary = (): React.ReactNode => {
	const router = useRouter()

	return (
		<>
			<Stack.Title>Component Library</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button icon="xmark" onPress={() => router.back()} />
			</Stack.Toolbar>

			<TableView>
				<Section>
					<PushButtonCell
						onPress={() => router.navigate('/(component-library)/BadgeLibrary')}
						title="Badges"
					/>
					<PushButtonCell
						onPress={() =>
							router.navigate('/(component-library)/ButtonLibrary')
						}
						title="Buttons"
					/>
					<PushButtonCell
						onPress={() =>
							router.navigate('/(component-library)/ColorsLibrary')
						}
						title="Colors"
					/>
					<PushButtonCell
						onPress={() =>
							router.navigate('/(component-library)/ContextMenuLibrary')
						}
						title="Context Menus"
					/>
					<PushButtonCell
						onPress={() =>
							router.navigate('/(component-library)/FaqBannerLibrary')
						}
						title="FAQ Banners"
					/>
				</Section>
			</TableView>
		</>
	)
}
