// @flow
import * as React from 'react'
import * as c from '@frogpond/colors'
import {View, ScrollView} from 'glamorous-native'
import {Markdown} from '@frogpond/markdown'
import {type NavigationScreenProp} from 'react-navigation'

type Props = {
	licenseText: string,
	navigation: NavigationScreenProp<*>,
}

export class LicenseDetailView extends React.Component<Props> {
	static navigationOptions = {
		title: 'License',
	}

	render() {
		const licenseText = this.props.navigation.state.params

		return (
			<ScrollView
				backgroundColor={c.white}
				contentInsetAdjustmentBehavior="automatic"
				paddingHorizontal={15}
			>
				<View paddingVertical={15}>
					<Markdown source={licenseText} />
				</View>
			</ScrollView>
		)
	}
}
