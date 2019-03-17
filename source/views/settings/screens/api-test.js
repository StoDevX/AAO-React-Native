// @flow
import * as React from 'react'
import * as c from '@frogpond/colors'
import {Platform, StyleSheet, TextInput, View} from 'react-native'
import {Toolbar} from '@frogpond/toolbar'
import {fetch} from '@frogpond/fetch'
import {API} from '@frogpond/api'
import glamorous from 'glamorous-native'
import {iOSUIKit, material} from 'react-native-typography'
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
	data: {
		padding: 10,
	},
	error: {
		padding: 10,
		color: c.brickRed,
	},
})

export const Paragraph = glamorous(TextInput)({
	marginVertical: 3,
	paddingRight: 4,
	...Platform.select({
		ios: iOSUIKit.bodyObject,
		android: material.body1Object,
	}),
})

type Props = {
	navigation: NavigationScreenProp<*>,
}

type State = {
	results: string,
	error: string,
}

export class APITestView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		title: 'API Tester',
	}

	state = {
		results: '',
		error: '',
	}

	fetchData = async (path: string) => {
		try {
			let responseData: string = await fetch(API(path), {
				cache: 'no-store',
			}).text()
			this.setState(() => ({results: responseData, error: ''}))
		} catch (err) {
			this.setState(() => ({results: '', error: JSON.stringify(err)}))
		}
	}

	render() {
		let {error, results} = this.state
		return (
			<>
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
				<View style={styles.container}>
					{error ? (
						<Paragraph editable={false} multiline={true} style={styles.error}>
							{error}
						</Paragraph>
					) : null}
					{results ? (
						<Paragraph editable={false} multiline={true} style={styles.data}>
							{results}
						</Paragraph>
					) : null}
				</View>
			</>
		)
	}
}
