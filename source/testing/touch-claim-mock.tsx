import * as React from 'react'
import {View} from 'react-native'

import type {TouchClaimViewProps} from '@frogpond/touch-claim'

/// The module reaches expo-modules-core's native view registry, which does
/// not exist under Jest, so its children render in a plain view instead. What
/// a claimed touch keeps from the sheet around it is UIKit's, and only a
/// device shows it.
export function TouchClaimView({claims: _claims, ...rest}: TouchClaimViewProps): React.ReactNode {
	return <View {...rest} />
}
