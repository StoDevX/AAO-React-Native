// @flow
import * as React from 'react'
import {View, TextInput, StyleSheet} from 'react-native'
import {NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {Toolbar} from '@frogpond/toolbar'
import type {TopLevelViewPropsType} from '../types'
import {BonAppHostedMenu} from './menu-bonapp'

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	default: {
		height: 44,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: c.black,
		flex: 1,
		fontSize: 13,
		paddingVertical: 4,
		paddingHorizontal: 8,
	},
})

type Props = TopLevelViewPropsType

type State = {
	cafeId: string,
}

export class BonAppPickerView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		title: 'BonApp',
	}

	state = {
		cafeId: '',
	}

	chooseCafe = (cafeId: string) => {
		if (!/^\d*$/u.test(cafeId)) {
			return
		}
		this.setState(() => ({cafeId}))
	}

	render() {
		return (
			<View style={styles.container}>
				<Toolbar onPress={() => {}}>
					<TextInput
						keyboardType="numeric"
						onEndEditing={e => this.chooseCafe(e.nativeEvent.text)}
						placeholder="id"
						returnKeyType="done"
						style={styles.default}
					/>
				</Toolbar>
				{this.state.cafeId ? (
					<BonAppHostedMenu
						key={this.state.cafeId}
						cafe={{id: this.state.cafeId}}
						loadingMessage={['Loading…']}
						name="BonApp"
						navigation={this.props.navigation}
					/>
				) : (
					<NoticeView text="Please enter a Cafe ID." />
				)}
			</View>
		)
	}
}
