import * as React from 'react'
import {View} from 'react-native'

import type {DragToDismissViewProps} from '@frogpond/drag-to-dismiss'

/// The module reaches expo-modules-core's native view registry, which does
/// not exist under Jest, so its children render in a plain view instead. The
/// view keeps its drag callbacks, so a test can fire them from any child; the
/// drag itself is UIKit's to follow, and the UITests cover it.
export function DragToDismissView(props: DragToDismissViewProps): React.ReactNode {
	return <View {...props} />
}
