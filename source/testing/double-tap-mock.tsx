import * as React from 'react'
import {View} from 'react-native'

import type {DoubleTapViewProps} from '@frogpond/double-tap'

/// The module reaches expo-modules-core's native view registry, which does
/// not exist under Jest, so its children render in a plain
/// view instead. The double tap itself is UIKit's to count; the UITests cover it.
export function DoubleTapView({
	onDoubleTap: _onDoubleTap,
	...rest
}: DoubleTapViewProps): React.ReactNode {
	return <View {...rest} />
}
