import * as React from 'react'
import * as c from '@frogpond/colors'
import {StyleSheet, TextInput, View} from 'react-native'
import SegmentedControl from '@react-native-community/segmented-control'
import {Toolbar} from '@frogpond/toolbar'
import {client} from '@frogpond/api'
import {iOSUIKit} from 'react-native-typography'
import {DebugView} from '../../screens/debug'
import {useQuery} from '@tanstack/react-query'

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
	output: {
		marginVertical: 3,
		paddingRight: 4,
		...iOSUIKit.bodyObject,
	},
})

export const IOSAPITestView = (): JSX.Element => {
	let [path, setPath] = React.useState<string>('')
	let [selectedIndex, setSelectedIndex] = React.useState(0)

	let {data, error} = useQuery({
		queryKey: ['api-test', path],
		queryFn: ({signal, queryKey: [_group, path]}) => {
			return client.get(path, {signal, cache: 'no-store'}).text()
		},
	})

	let APIResponse =
		error instanceof Error ? (
			<TextInput
				editable={false}
				// this aligns the text to the top on iOS, and centers it on Android
				multiline={true}
				scrollEnabled={true}
				style={[styles.output, styles.error]}
				// use multiline with textAlignVertical="top" for the same behavior in both platforms
				textAlignVertical="top"
				value={error.toString()}
			/>
		) : selectedIndex === 0 ? (
			<TextInput
				editable={false}
				// this aligns the text to the top on iOS, and centers it on Android
				multiline={true}
				scrollEnabled={true}
				style={[styles.output, styles.data]}
				// use multiline with textAlignVertical="top" for the same behavior in both platforms
				textAlignVertical="top"
				value={data ?? ''}
			/>
		) : (
			<DebugView state={JSON.parse(data || '{}')} />
		)

	return (
		<View style={styles.container}>
			<Toolbar>
				<TextInput
					autoCapitalize="none"
					autoCorrect={false}
					keyboardType="web-search"
					onEndEditing={(e) => setPath(e.nativeEvent.text)}
					placeholder="path/to/resource"
					returnKeyType="done"
					style={styles.default}
				/>
			</Toolbar>

			{/**
			  * SegmentedControl component seems to be unhappy
			  *
			  * @TODO fix 'JSX element class does not support attributes because it does not have a 'props' property.'
			  * 
			  * Options: 
			  * 1. Rework the typings of SegmentedControl
			  * 2. Use react-native-paper@5.0 SegmentedButton
			  */}
			<SegmentedControl
				onChange={(event: { nativeEvent: { selectedSegmentIndex: number } }) => {
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
