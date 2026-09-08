import * as React from 'react'
import {View} from 'react-native'

/**
 * `expo-router` reaches expo-modules-core's native bindings on import, which
 * do not exist under Jest -- the same problem the `@expo/ui/swift-ui` mocks
 * solve for that module. `calendar-picker.tsx` only uses `Stack.Toolbar` for
 * structure, so the stand-in just has to render its children.
 */
type WithChildren = {children?: React.ReactNode}

function Toolbar({children}: WithChildren): React.ReactNode {
	return <View>{children}</View>
}

Toolbar.Button = function ToolbarButton({children}: WithChildren): React.ReactNode {
	return <View>{children}</View>
}

Toolbar.Spacer = function ToolbarSpacer(): React.ReactNode {
	return null
}

Toolbar.View = function ToolbarView({children}: WithChildren): React.ReactNode {
	return <View>{children}</View>
}

export const Stack = {Toolbar}
