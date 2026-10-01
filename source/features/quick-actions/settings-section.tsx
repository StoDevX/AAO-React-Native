import * as React from 'react'
import {Section} from '@expo/ui/swift-ui'
import {useRouter} from 'expo-router'

import {NavigationRow} from '../../components/rows'

/** The Settings root's way into the quick-action picker. */
export function QuickActionsSection(): React.ReactNode {
	let router = useRouter()

	return (
		<Section title="Quick Actions">
			<NavigationRow
				onPress={() => router.navigate('/QuickActions')}
				title="Home Screen Quick Actions"
			/>
		</Section>
	)
}
