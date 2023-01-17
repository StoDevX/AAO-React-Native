import * as React from 'react'
import * as c from '@frogpond/colors'
import {StyleSheet, TextInput, View} from 'react-native'
import SegmentedControl from '@react-native-community/segmented-control'
import {Toolbar} from '@frogpond/toolbar'
import {fetch} from '@frogpond/fetch'
import {API} from '@frogpond/api'
import glamorous from 'glamorous-native'
import {iOSUIKit} from 'react-native-typography'
import {DebugListView} from '../../screens/debug'
import {useNavigation} from '@react-navigation/native'

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

const Segment = glamorous(SegmentedControl)({})

export const IOSAPITestView = (): JSX.Element => {
	let [results, setResults] = React.useState<string | null>(null)
	let [error, setError] = React.useState<string | null>(null)
	let [selectedIndex, setSelectedIndex] = React.useState(0)

	let navigation = useNavigation()

	let fetchData = async (path: string) => {
		try {
			let correctedPath: `/${string}` = path.startsWith('/')
				? (path as `/${string}`)
				: `/${path}`
			let responseData: string = await fetch(API(correctedPath), {
				cache: 'no-store',
			}).text()
			setResults(responseData)
			setError(null)
		} catch (err) {
			setResults(null)
			setError(JSON.stringify(err))
		}
	}

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
			value={results ?? ''}
		/>
	) : (
		<DebugListView apiTest={true} navigation={navigation} state={results} />
	)

	return (
		<View style={styles.container}>
			<Toolbar>
				<TextInput
					autoCapitalize="none"
					autoCorrect={false}
					keyboardType="web-search"
					onEndEditing={(e) => fetchData(e.nativeEvent.text)}
					placeholder="path/to/resource"
					returnKeyType="done"
					style={styles.default}
				/>
			</Toolbar>

			<Segment
				onChange={(event) => {
					let selectedSegment = event.nativeEvent.selectedSegmentIndex
					setSelectedIndex(selectedSegment)
				}}
				selectedIndex={selectedIndex}
				values={['Text', 'Parsed']}
			/>

			{APIResponse}
		</View>
	)
}
