// @flow
import * as React from 'react'
import * as c from '@frogpond/colors'
import {StyleSheet, TextInput, View, SegmentedControlIOS} from 'react-native'
import {Toolbar} from '@frogpond/toolbar'
import {fetch} from '@frogpond/fetch'
import {API} from '@frogpond/api'
import glamorous from 'glamorous-native'
import {iOSUIKit} from 'react-native-typography'
import type {NavigationScreenProp} from 'react-navigation'
import {DebugListView} from '../../screens/debug'

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

const Output = glamorous(TextInput)({
	marginVertical: 3,
	paddingRight: 4,
	...iOSUIKit.bodyObject,
})

const Segment = glamorous(SegmentedControlIOS)({})

type Props = {
	navigation: NavigationScreenProp<*>,
}

type State = {
	results: ?string,
	error: ?string,
	selectedIndex: number,
}

export class IOSAPITestView extends React.PureComponent<Props, State> {
	static navigationOptions = {
		title: 'API Tester',
	}

	state = {
		results: null,
		error: null,
		selectedIndex: 0,
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

	onChangeSegment = (event: any) => {
		const selectedSegment = event.nativeEvent.selectedSegmentIndex
		this.setState(() => ({selectedIndex: selectedSegment}))
	}

	render() {
		let {error, results, selectedIndex} = this.state

		let APIResponse = error ? (
			<Output
				editable={false}
				// this aligns the text to the top on iOS, and centers it on Android
				multiline={true}
				scrollEnabled={true}
				style={styles.error}
				// use multiline with textAlignVertical="top" for the same behavior in both platforms
				textAlignVertical="top"
				value={error}
			/>
		) : selectedIndex === 0 ? (
			<Output
				editable={false}
				// this aligns the text to the top on iOS, and centers it on Android
				multiline={true}
				scrollEnabled={true}
				style={styles.data}
				// use multiline with textAlignVertical="top" for the same behavior in both platforms
				textAlignVertical="top"
				value={results}
			/>
		) : (
			<DebugListView
				apiTest={true}
				navigation={this.props.navigation}
				state={results}
			/>
		)

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

				<Segment
					onChange={this.onChangeSegment}
					selectedIndex={selectedIndex}
					values={['Text', 'Parsed']}
				/>

				{APIResponse}
			</View>
		)
	}
}
