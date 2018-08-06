// @flow

import * as React from 'react'
import * as glamorous from 'glamorous-native'
import * as c from '../components/colors'
import sample from 'lodash/sample'
import {CELL_MARGIN} from './button'

const messages = [
	'☃️ An Unofficial App Project ☃️',
	'For students, by students',
	'By students, for students',
	'An unofficial St. Olaf app',
	'For Oles, by Oles',
	'☃️',
	'🦁',
	'made with  ⃟ in Ñ̸̞͖̘̱̰̥͇̗̂͌̇̎͊ͯ̎̓̎ͥ̋̐ͤͪͭ̚͘͢͢ø̸̛̞͊̎ͩ̍̉̑ͯͫͥ̚͟ͅ ̱̬̹̱̦®̵̬͖͙̻̩͓̖̠͉͈͍̈́̅͂͛̅̀͗ͤ̓́͡†̵̧͙̥̫̫͎̘̩̲̥̖̈̌͋̀ͨ̑̽̍̆̓̒̒̄̈́͒̓̕͜ ͍̩̫̼ͅ˙̶͕̰̗͓̯̫̲̮͕̪̝͎̩̬̺̔ͯ̌̈̽̌ͨ͊͊͐̀͆̽̐̓̃́̚͢͟ ̞̞̤ƒ͚͙̤ͭͪ͑̄͆͑ͯ̆͗̆ͨ̍̀͟͢ ̙͎̝͕͔̠͉̩̯͕͚̗̤ͅî̹̗̩̫̝̝͙̠̹̣̺̤̆ͭ̾̋ͬ̂ͫ̃̏ͥͬ́͜͠é̚ ̸͔͕̗̞̰́̅̅͒ ̪̩̞̰̫͓̞̱̫̞̭̯¬ͫ̾̆ ̍ͣ̎̀ͫͪͪ̋͌̂ ̪̘̯̝̤͌̆ͮ̕͜͜͡∂̢̛͕̻͖̈͌ͮ̂̾ͪͪ̑͋͂̂̂̂̈́̈́̓̌̍̌͜͞ ͙̫̤',
	'made with ∆ in Ñø®†˙ƒîé¬∂',
	'Made with ❤️❤️in Northfield, MN',
	'Made with 🤞 in ⬆️🌾',
	'⬆️🌾=🐄🏫♥️',
]

export function UnofficialAppNotice() {
	return (
		<glamorous.View
			justifyContent="center"
			marginBottom={CELL_MARGIN}
			marginHorizontal={CELL_MARGIN}
		>
			<glamorous.View backgroundColor="rgba(0,0,0,0.05)" borderRadius={7}>
				<glamorous.Text color={c.black25Percent} padding={8} textAlign="center">
					{sample(messages)}
				</glamorous.Text>
			</glamorous.View>
		</glamorous.View>
	)
}
