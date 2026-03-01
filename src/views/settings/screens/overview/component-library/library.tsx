import * as React from 'react'
import {Platform} from 'react-native'

import {CloseScreenButton} from '@frogpond/navigation-buttons'
import {TableView, Section} from '@frogpond/tableview'
import {PushButtonCell} from '@frogpond/tableview/cells'
import {useRouter} from 'expo-router'

export const ComponentLibrary = (): React.JSX.Element => {
	const router = useRouter()

	return (
		<TableView>
			<Section>
				<PushButtonCell
					onPress={() => router.push('/settings/component-library/badge')}
					title="Badges"
				/>
				<PushButtonCell
					onPress={() => router.push('/settings/component-library/button')}
					title="Buttons"
				/>
				<PushButtonCell
					onPress={() => router.push('/settings/component-library/colors')}
					title="Colors"
				/>
				<PushButtonCell
					onPress={() => router.push('/settings/component-library/context-menu')}
					title="Context Menus"
				/>
			</Section>
		</TableView>
	)
}
