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
			    @react-navigation/native-stack for the same reason as
			    ComponentLibraryNavigationOptions above. */}
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
