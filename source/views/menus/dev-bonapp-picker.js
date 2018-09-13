// @flow
import * as React from 'react'
import {View, TextInput, StyleSheet, Platform} from 'react-native'
import {TabBarIcon} from '@frogpond/navigation-tabs'
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
	menu: ?any,
}

export class BonAppPickerView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		tabBarLabel: 'BonApp',
		tabBarIcon: TabBarIcon('ionic'),
	}

	state = {
		cafeId: '34',
		menu: null,
	}

	chooseCafe = (cafeId: string) => {
		if (!/^\d*$/.test(cafeId)) {
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
						returnKeyType="done"
						style={styles.default}
						value={Platform.OS === 'ios' ? this.state.cafeId : null}
					/>
				</Toolbar>
				<BonAppHostedMenu
					key={this.state.cafeId}
					cafe={{id: this.state.cafeId}}
					loadingMessage={['Loading…']}
					name="BonApp"
					navigation={this.props.navigation}
				/>
			</View>
		)
	}
}
