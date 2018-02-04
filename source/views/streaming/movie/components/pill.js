// @flow

import * as React from 'react'
import * as c from '../../../components/colors'
import glamorous from 'glamorous-native'

type Colors = $Keys<typeof c.sto>

type Props = {
	children: React.Node,
	bgColorName: Colors,
}

export const Pill = ({children, bgColorName, ...props}: Props) => (
	<glamorous.View
		backgroundColor={c.sto[bgColorName]}
		borderRadius={50}
		{...props}
	>
		<glamorous.Text
			color={c.stoText[bgColorName]}
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
