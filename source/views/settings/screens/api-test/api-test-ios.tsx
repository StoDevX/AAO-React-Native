import * as React from 'react'
import * as c from '@frogpond/colors'
import {SegmentedControlIOS, StyleSheet, TextInput, View} from 'react-native'
import {Toolbar} from '@frogpond/toolbar'
import {client} from '@frogpond/api'
import glamorous from 'glamorous-native'
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
})

const Output = glamorous(TextInput)({
	marginVertical: 3,
	paddingRight: 4,
	...iOSUIKit.bodyObject,
})

const Segment = glamorous(SegmentedControlIOS)({})

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
			<Output
				editable={false}
				// this aligns the text to the top on iOS, and centers it on Android
				multiline={true}
				scrollEnabled={true}
				style={styles.error}
				// use multiline with textAlignVertical="top" for the same behavior in both platforms
				textAlignVertical="top"
				value={error.toString()}
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
