// @flow
import * as React from 'react'
import * as c from '@frogpond/colors'
import {StyleSheet, TextInput, ScrollView, Text, View} from 'react-native'
import {Toolbar} from '@frogpond/toolbar'
import {fetch} from '@frogpond/fetch'
import {API} from '@frogpond/api'
import glamorous from 'glamorous-native'
import {material} from 'react-native-typography'
import type {NavigationScreenProp} from 'react-navigation'

const styles = StyleSheet.create({
	container: {
		backgroundColor: c.white,
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

const Output = glamorous(ScrollView)({
	marginVertical: 3,
	paddingRight: 4,
	...material.body1Object,
})

type Props = {
	navigation: NavigationScreenProp<*>,
}

type State = {
	results: ?string,
	error: ?string,
}

export class AndroidAPITestView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		title: 'API Tester',
	}

	state = {
		results: null,
		error: null,
	}

	fetchData = async (path: string) => {
		try {
			let correctedPath = path.startsWith('/') ? path : `/${path}`
			let responseData: string = await fetch(API(correctedPath), {
				cache: 'no-store',
			}).text()
			this.setState(() => ({results: responseData, error: null}))
		} catch (err) {
			this.setState(() => ({results: null, error: JSON.stringify(err)}))
		}
	}

	render() {
		let {error, results} = this.state

		return (
			<View style={styles.container}>
				<Toolbar onPress={() => {}}>
					<TextInput
						autoCapitalize="none"
						autoCorrect={false}
						keyboardType="web-search"
						onEndEditing={e => this.fetchData(e.nativeEvent.text)}
						placeholder="path/to/resource"
						returnKeyType="done"
						style={styles.default}
					/>
				</Toolbar>

				<Output>
					<Text>{error ? error : results}</Text>
				</Output>
			</View>
		)
	}
}
