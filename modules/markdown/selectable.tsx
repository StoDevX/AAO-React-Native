import * as React from 'react'
import {Text, TextProps} from 'react-native'

export function SelectableText(props: TextProps): React.ReactNode {
	return <Text {...props} selectable={true} />
}
