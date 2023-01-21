import * as React from 'react'
import * as c from '@frogpond/colors'
import {ScrollView, StyleSheet, Text, TextInput, View} from 'react-native'
import {Toolbar} from '@frogpond/toolbar'
import {client} from '@frogpond/api'
import glamorous from 'glamorous-native'
import {material} from 'react-native-typography'
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
})

const Output = glamorous(ScrollView)({
	marginVertical: 3,
	paddingRight: 4,
	...material.body1Object,
})

export const AndroidAPITestView = (): JSX.Element => {
	let [path, setPath] = React.useState<string>('')

	let {data, error} = useQuery({
		queryKey: ['api-test', path],
		queryFn: ({signal, queryKey: [_group, path]}) => {
			return client.get(path, {signal, cache: 'no-store'}).text()
		},
	})

	return (
		<View style={styles.container}>
			<Toolbar>
				<TextInput
					autoCapitalize="none"
					autoCorrect={false}
					keyboardType="web-search"
					onEndEditing={(e) => setPath(e.nativeEvent.text)}
					placeholder="/path/to/resource"
					returnKeyType="done"
					style={styles.default}
				/>
			</Toolbar>

			<Output>
				<Text>{error ? error : data}</Text>
			</Output>
		</View>
	)
}
