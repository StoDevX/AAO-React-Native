import * as React from 'react'
import {Stack} from 'expo-router'

import {
	NetworkLoggerNavigationOptions,
	NetworkLoggerView,
} from '../../source/views/settings'

export default function NetworkLoggerPage(): React.ReactNode {
	return (
		<>
			{/* NetworkLoggerNavigationOptions is still typed against
			    @react-navigation/native-stack because source/navigation/routes.tsx
			    also consumes it (until checkpoint 7 deletes that file); expo-router's
			    Stack.Screen expects its own forked -- structurally incompatible --
			    NativeStackNavigationOptions type. presentation/gestureEnabled here are
			    redundant with the entry in app/(settings)/_layout.tsx (the parent's
			    copy is what actually takes effect) -- matching
			    BuildingHoursProblemReport's own established precedent of listing
			    modal flags in both places. */}
			<Stack.Screen
				options={
					NetworkLoggerNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<NetworkLoggerView />
		</>
	)
}
