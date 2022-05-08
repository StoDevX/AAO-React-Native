import * as React from 'react'
import {View, TextInput, StyleSheet} from 'react-native'
import {NoticeView} from '@frogpond/notice'
import * as c from '@frogpond/colors'
import {Toolbar} from '@frogpond/toolbar'
import {BonAppHostedMenu} from './menu-bonapp'

const styles = StyleSheet.create({
	container: {
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

export const BonAppPickerView = (): JSX.Element => {
	let [cafeId, setCafeId] = React.useState('')

	let chooseCafe = (cafeId: string) => {
		if (!/^\d*$/u.test(cafeId)) {
			return
		}
		setCafeId(cafeId)
	}

	return (
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
	)
}
