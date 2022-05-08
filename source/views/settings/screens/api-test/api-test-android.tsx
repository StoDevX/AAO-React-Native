import * as React from 'react'
import * as c from '@frogpond/colors'
import {ScrollView, StyleSheet, Text, TextInput, View} from 'react-native'
import {Toolbar} from '@frogpond/toolbar'
import {fetch} from '@frogpond/fetch'
import {API} from '@frogpond/api'
import glamorous from 'glamorous-native'
import {material} from 'react-native-typography'

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

export const AndroidAPITestView = (): JSX.Element => {
	let [results, setResults] = React.useState<string | null>(null)
	let [error, setError] = React.useState<string | null>(null)

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

	return (
		<View style={styles.container}>
			<Toolbar>
				<TextInput
					autoCapitalize="none"
					autoCorrect={false}
					keyboardType="web-search"
					onEndEditing={(e) => fetchData(e.nativeEvent.text)}
					placeholder="/path/to/resource"
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
