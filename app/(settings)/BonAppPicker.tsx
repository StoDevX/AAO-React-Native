import * as React from 'react'
import {Stack} from 'expo-router'

import {
	BonAppPickerView,
	DevBonAppNavigationOptions,
} from '../../source/views/menus/dev-bonapp-picker'

export default function BonAppPickerPage(): React.ReactNode {
	return (
		<>
			{/* DevBonAppNavigationOptions is still typed against
			    @react-navigation/native-stack because source/navigation/routes.tsx
			    also consumes it (until checkpoint 7 deletes that file); expo-router's
			    Stack.Screen expects its own forked -- structurally incompatible --
			    NativeStackNavigationOptions type. */}
			<Stack.Screen
				options={
					DevBonAppNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<BonAppPickerView />
		</>
	)
}
