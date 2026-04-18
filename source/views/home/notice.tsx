import React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import sample from 'lodash/sample'
import {CELL_MARGIN} from './button'
import {ContextMenu} from '@frogpond/context-menu'
import {useDispatch, useSelector} from 'react-redux'
import restart from 'react-native-restart-newarch'
import {
	selectDevModeOverride,
	setDevModeOverride,
} from '../../redux/parts/settings'
import {useIsDevMode} from '../../lib/use-is-dev-mode'

const BASE_MESSAGES = [
	'☃️ An Unofficial App Project ☃️',
	'For students, by students',
	'By students, for students',
	'An unofficial St. Olaf app',
	'For Oles, by Oles',
	'☃️',
	'🦁',
	'Made with ❤️ in Northfield, MN',
]

const DEV_MESSAGES = [
	'made with  ⃟ in Ñ̸̞͖̘̱̰̥͇̗̂͌̇̎͊ͯ̎̓̎ͥ̋̐ͤͪͭ̚͘͢͢ø̸̛̞͊̎ͩ̍̉̑ͯͫͥ̚͟ͅ ̱̬̹̱̦®̵̬͖͙̻̩͓̖̠͉͈͍̈́̅͂͛̅̀͗ͤ̓́͡†̵̧͙̥̫̫͎̘̩̲̥̖̈̌͋̀ͨ̑̽̍̆̓̒̒̄̈́͒̓̕͜ ͍̩̫̼ͅ˙̶͕̰̗͓̯̫̲̮͕̪̝͎̩̬̺̔ͯ̌̈̽̌ͨ͊͊͐̀͆̽̐̓̃́̚͢͟ ̞̞̤ƒ͚͙̤ͭͪ͑̄͆͑ͯ̆͗̆ͨ̍̀͟͢ ̙͎̝͕͔̠͉̩̯͕͚̗̤ͅî̹̗̩̫̝̝͙̠̹̣̺̤̆ͭ̾̋ͬ̂ͫ̃̏ͥͬ́͜͠é̚ ̸͔͕̗̞̰́̅̅͒ ̪̩̞̰̫͓̞̱̫̞̭̯¬ͫ̾̆ ̍ͣ̎̀ͫͪͪ̋͌̂ ̪̘̯̝̤͌̆ͮ̕͜͜͡∂̢̛͕̻͖̈͌ͮ̂̾ͪͪ̑͋͂̂̂̂̈́̈́̓̌̍̌͜͞ ͙̫̤',
	'made with ∆ in Ñø®†˙ƒîé¬∂',
	'Made with 🤞 in ⬆️🌾',
	'⬆️🌾=🐄🏫♥️',
]

const RESTART_ACTION = 'Restart app'
const DEV_MODE_ACTION = 'Enable dev mode'

export function UnofficialAppNotice(): React.ReactNode {
	const dispatch = useDispatch()
	const devModeOverride = useSelector(selectDevModeOverride)
	const isDev = useIsDevMode()

	const message = React.useMemo(() => {
		const messages = isDev ? [...BASE_MESSAGES, ...DEV_MESSAGES] : BASE_MESSAGES
		return sample(messages)
	}, [isDev])

	const onPressMenuItem = (menuKey: string) => {
		if (menuKey === RESTART_ACTION) {
			restart.Restart()
		} else if (menuKey === DEV_MODE_ACTION) {
			dispatch(setDevModeOverride(!devModeOverride))
		}
	}

	return (
		<ContextMenu
			actions={[RESTART_ACTION, DEV_MODE_ACTION]}
			onPressMenuItem={onPressMenuItem}
			selectedAction={devModeOverride ? DEV_MODE_ACTION : undefined}
			testID="home-notice"
			title=""
		>
			<View style={[styles.wrapper, styles.background]}>
				<Text style={styles.text}>{message}</Text>
			</View>
		</ContextMenu>
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
