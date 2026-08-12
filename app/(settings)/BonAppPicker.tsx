import * as React from 'react'
import {View, TextInput, StyleSheet} from 'react-native'
import {Stack, useNavigation} from 'expo-router'
import {NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {Toolbar} from '@frogpond/toolbar'

import {BonAppHostedMenu} from '../../source/features/menus/menu-bonapp'

export default function BonAppPickerPage(): React.ReactNode {
	const navigation = useNavigation()

	let [cafeId, setCafeId] = React.useState('')

	let chooseCafe = (selectedCafeId: string) => {
		if (!/^\d*$/u.test(selectedCafeId)) {
			return
		}
		setCafeId(selectedCafeId)
	}

	return (
		<>
			<Stack.Title>Dev BonApp Picker</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<View style={styles.container}>
				<Toolbar>
					<TextInput
						keyboardType="numeric"
						onEndEditing={(e) => chooseCafe(e.nativeEvent.text)}
						placeholder="id"
						returnKeyType="done"
						style={styles.default}
					/>
				</Toolbar>
				{cafeId ? (
					<BonAppHostedMenu
						key={cafeId}
						cafe={{id: cafeId}}
						loadingMessage={['Loading…']}
						name="BonApp"
					/>
				) : (
					<NoticeView text="Please enter a Cafe ID." />
				)}
			</View>
		</>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	default: {
		height: 44,
		borderBottomWidth: StyleSheet.hairlineWidth,
		borderColor: c.label,
		flex: 1,
		fontSize: 13,
		paddingVertical: 4,
		paddingHorizontal: 8,
	},
})
