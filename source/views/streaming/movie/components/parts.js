// @flow

import {Platform} from 'react-native'
import * as React from 'react'
import * as c from '../../../components/colors'
import glamorous from 'glamorous-native'
import {human, material} from 'react-native-typography'

export const Header = glamorous.view({
	backgroundColor: c.gray,
	position: 'relative',
})

export const Padding = glamorous.view({
	paddingHorizontal: 16,
})

export const MovieInfo = glamorous(Padding)({
	marginTop: 18,
})

export const Spacer = glamorous.view({flex: 1})

export const FixedSpacer = glamorous.view({flexBasis: 16})

export const Title = glamorous.text({
	...Platform.select({
		ios: human.title1Object,
	}),
})

export const Card = glamorous.view({
	borderRadius: 8,
	shadowRadius: 12,
	shadowOpacity: 0.2,
	shadowOffset: {height: 4, width: 4},
})

export const PaddedCard = ({children}: {children: React.Node}) => (
	<Card
		marginHorizontal={16}
		marginVertical={16}
		paddingHorizontal={16}
		paddingVertical={16}
	>
		{children}
	</Card>
)

export const Heading = glamorous.text({...human.headlineObject})
export const Text = glamorous.text({...human.bodyObject})
