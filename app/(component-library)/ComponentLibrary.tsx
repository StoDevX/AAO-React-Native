import * as React from 'react'
import {Stack} from 'expo-router'

import {
	ComponentLibrary,
	ComponentLibraryNavigationOptions,
} from '../../source/views/settings'

// This file is named ComponentLibrary.tsx (not index.tsx) so it doesn't
// claim the bare `/` route -- (component-library) is a top-level group,
// a sibling of (home), so an index.tsx here would collide with
// app/(home)/index.tsx for the unqualified `/` path. This screen is
// reachable at /ComponentLibrary. PR 8's developer.tsx entry point must
// push to '/ComponentLibrary', not '/(component-library)' or '/'.
export default function ComponentLibraryRootPage(): React.ReactNode {
	return (
		<>
			{/* ComponentLibraryNavigationOptions is still typed against
			    @react-navigation/native-stack because source/navigation/routes.tsx
			    also consumes it (until checkpoint 7 deletes that file); expo-router's
			    Stack.Screen expects its own forked -- structurally incompatible --
			    NativeStackNavigationOptions type. */}
			<Stack.Screen
				options={
					ComponentLibraryNavigationOptions as React.ComponentProps<
						typeof Stack.Screen
					>['options']
				}
			/>
			<ComponentLibrary />
		</>
	)
}
