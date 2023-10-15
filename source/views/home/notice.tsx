import React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import sample from 'lodash/sample'
import {CELL_MARGIN} from './button'
import {isDevMode} from '@frogpond/constants'

let messages = [
	'☃️ An Unofficial App Project ☃️',
	'For students, by students',
	'By students, for students',
	'An unofficial St. Olaf app',
	'For Oles, by Oles',
	'☃️',
	'🦁',
	'Made with ❤️ in Northfield, MN',
]

if (isDevMode()) {
	messages = [
		...messages,
		'made with  ⃟ in Ñ̸̞͖̘̱̰̥͇̗̂͌̇̎͊ͯ̎̓̎ͥ̋̐ͤͪͭ̚͘͢͢ø̸̛̞͊̎ͩ̍̉̑ͯͫͥ̚͟ͅ ̱̬̹̱̦®̵̬͖͙̻̩͓̖̠͉͈͍̈́̅͂͛̅̀͗ͤ̓́͡†̵̧͙̥̫̫͎̘̩̲̥̖̈̌͋̀ͨ̑̽̍̆̓̒̒̄̈́͒̓̕͜ ͍̩̫̼ͅ˙̶͕̰̗͓̯̫̲̮͕̪̝͎̩̬̺̔ͯ̌̈̽̌ͨ͊͊͐̀͆̽̐̓̃́̚͢͟ ̞̞̤ƒ͚͙̤ͭͪ͑̄͆͑ͯ̆͗̆ͨ̍̀͟͢ ̙͎̝͕͔̠͉̩̯͕͚̗̤ͅî̹̗̩̫̝̝͙̠̹̣̺̤̆ͭ̾̋ͬ̂ͫ̃̏ͥͬ́͜͠é̚ ̸͔͕̗̞̰́̅̅͒ ̪̩̞̰̫͓̞̱̫̞̭̯¬ͫ̾̆ ̍ͣ̎̀ͫͪͪ̋͌̂ ̪̘̯̝̤͌̆ͮ̕͜͜͡∂̢̛͕̻͖̈͌ͮ̂̾ͪͪ̑͋͂̂̂̂̈́̈́̓̌̍̌͜͞ ͙̫̤',
		'made with ∆ in Ñø®†˙ƒîé¬∂',
		'Made with 🤞 in ⬆️🌾',
		'⬆️🌾=🐄🏫♥️',
	]
}

export function UnofficialAppNotice(): JSX.Element {
	return (
		<View style={[styles.wrapper, styles.background]}>
			<Text style={styles.text}>{sample(messages)}</Text>
		</View>
	)
}

const styles = StyleSheet.create({
	wrapper: {
		justifyContent: 'center',
		marginBottom: CELL_MARGIN,
		marginHorizontal: CELL_MARGIN,
	},
	background: {
		backgroundColor: c.secondarySystemFill,
		borderRadius: 7,
	},
	text: {
		color: c.secondaryLabel,
		padding: 8,
		textAlign: 'center',
	},
})
