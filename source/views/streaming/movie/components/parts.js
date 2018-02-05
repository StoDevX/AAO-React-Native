// @flow

import {Platform, TouchableWithoutFeedback} from 'react-native'
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

export const SectionHeading = glamorous.text({
	...Platform.select({
		ios: human.subheadObject,
	}),
	fontWeight: '900',
	paddingHorizontal: 16,
	marginTop: 24,
})

export const Card = glamorous.view({
	borderRadius: 8,
	shadowRadius: 12,
	shadowOpacity: 0.2,
	shadowOffset: {height: 4, width: 4},
})

export const PaddedCard = ({children}: {children: React.Node}) => (
	<Card margin={16} padding={16}>
		{children}
	</Card>
)

export const Heading = glamorous.text({
	...human.subheadObject,
	fontWeight: '700',
})

export const Text = glamorous.text({...human.bodyObject})

type ShrinkWhenTouchedProps = {
	onPress: () => any,
	style?: any,
	children: React.Node,
}
type ShrinkWhenTouchedState = {
	pressed: boolean,
}
export class ShrinkWhenTouched extends React.PureComponent<
	ShrinkWhenTouchedProps,
	ShrinkWhenTouchedState,
> {
	state = {pressed: false}

	onPressIn = () => this.setState(() => ({pressed: true}))
	onPressOut = () => this.setState(() => ({pressed: false}))

	render() {
		const {children, style, onPress} = this.props
		const {pressed: isPressed} = this.state

		return (
			<TouchableWithoutFeedback
				onPress={onPress}
				onPressIn={this.onPressIn}
				onPressOut={this.onPressOut}
			>
				<glamorous.View
					style={style}
					transform={isPressed ? [{scale: 0.95}] : []}
				>
					{children}
				</glamorous.View>
			</TouchableWithoutFeedback>
		)
	}
}
