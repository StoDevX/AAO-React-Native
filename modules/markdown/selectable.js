// @flow

import * as React from 'react'
import {Text} from 'react-native'

type Props = {}

export function SelectableText(props: Props) {
	return <Text selectable={true} {...props} />
}
