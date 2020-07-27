// @flow

import * as React from 'react'
import {Text} from 'react-native'

type Props = any

export function SelectableText(props: Props) {
	return <Text selectable={true} {...props} />
}
