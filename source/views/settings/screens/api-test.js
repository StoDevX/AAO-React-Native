// @flow
import * as React from 'react'
import * as c from '@frogpond/colors'
import {
	Platform,
	StyleSheet,
	TextInput,
	View,
	SegmentedControlIOS,
} from 'react-native'
import {Toolbar} from '@frogpond/toolbar'
import {fetch} from '@frogpond/fetch'
import {API} from '@frogpond/api'
import glamorous from 'glamorous-native'
import {iOSUIKit, material} from 'react-native-typography'
import type {NavigationScreenProp} from 'react-navigation'
import {DebugListView} from '../../../views/settings/screens/debug'

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

const Paragraph = glamorous(TextInput)({
	marginVertical: 3,
	paddingRight: 4,
	...Platform.select({
		ios: iOSUIKit.bodyObject,
		android: material.body1Object,
	}),
})

const Segment = glamorous(SegmentedControlIOS)({})

type Props = {
	navigation: NavigationScreenProp<*>,
}

type State = {
	results: string | null,
	error: string | null,
	selectedIndex: number,
}

export class APITestView extends React.PureComponent<Props, State> {
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
			let correctedPath = path.charAt(0) === '/' ? path : `/${path}`
			let responseData: string = await fetch(API(correctedPath), {
				cache: 'no-store',
			}).text()
			this.setState(() => ({results: responseData, error: null}))
		} catch (err) {
			this.setState(() => ({results: null, error: JSON.stringify(err)}))
		}
	}

	render() {
		let {error, results, selectedIndex} = this.state

		let jsonError = error ? (
			<Paragraph editable={false} multiline={true} style={styles.error}>
				{error}
			</Paragraph>
		) : null

		let jsonData = results ? (
			<Paragraph editable={false} multiline={true} style={styles.data}>
				{results}
			</Paragraph>
		) : null

		let showIndex = () => {
			return selectedIndex === 0 ? (
				<>
					{jsonData}
					{jsonError}
				</>
			) : (
				<DebugListView
					navigation={this.props.navigation}
					state={results}
					testing={true}
				/>
			)
		}
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

				<Segment
					onChange={event => {
						this.setState({
							selectedIndex: event.nativeEvent.selectedSegmentIndex,
						})
					}}
					selectedIndex={selectedIndex}
					values={['JSON', 'List']}
				/>

				<View style={styles.container}>{showIndex()}</View>
			</>
		)
	}
}
