import * as React from 'react'
import {Stack} from 'expo-router'

import {
	FaqBannerLibrary,
	FaqBannerNavigationOptions,
} from '../../source/views/settings'

export default function FaqBannerLibraryPage(): React.ReactNode {
	return (
		<>
			{/* FaqBannerNavigationOptions is still typed against
			    @react-navigation/native-stack because source/navigation/routes.tsx
			    also consumes it (until checkpoint 7 deletes that file); expo-router's
			    Stack.Screen expects its own forked -- structurally incompatible --
			    NativeStackNavigationOptions type. */}
			<Stack.Screen
				options={
					FaqBannerNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<FaqBannerLibrary />
		</>
	)
}
