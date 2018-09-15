// @flow

import * as React from 'react'
import * as c from '@frogpond/colors'
import {firstReadable} from '@frogpond/colors'
import glamorous from 'glamorous-native'

type Props = {
	children: React.Node,
	bgColor: string,
}

export const Pill = ({children, bgColor, ...props}: Props) => {
	return (
		<glamorous.View backgroundColor={bgColor} borderRadius={50} {...props}>
			<glamorous.Text
				color={firstReadable(bgColor, [c.black, c.white])}
				fontSize={12}
				fontVariant={['small-caps']}
				paddingBottom={3}
				paddingHorizontal={8}
				paddingTop={1}
			>
				{children}
			</glamorous.Text>
		</glamorous.View>
	)
}
