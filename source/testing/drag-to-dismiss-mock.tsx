import * as React from 'react'
import {View} from 'react-native'

import type {DragToDismissViewProps} from '@frogpond/drag-to-dismiss'

/// The module reaches expo-modules-core's native view registry, which does
/// not exist under Jest, so its children render in a plain view instead. The
/// drag itself is UIKit's to follow; the UITests cover it.
export function DragToDismissView({
	onDismiss: _onDismiss,
	...rest
}: DragToDismissViewProps): React.ReactNode {
	return <View {...rest} />
}
