import * as React from 'react'
import {Cell, Section} from '@frogpond/tableview'
import {CellToggle, PushButtonCell} from '@frogpond/tableview/cells'
import {trackedOpenUrl} from '@frogpond/open-url'
import {GH_BASE_URL} from '../../../../lib/constants'
import * as storage from '../../../../lib/storage'
import {useNavigation} from '@react-navigation/native'
import {ContextMenu} from './context-menu'
import {Button} from '@frogpond/button'
import restart from 'react-native-restart'
import {upperFirst} from 'lodash'

export let MiscellanySection = (): JSX.Element => {
	let navigation = useNavigation()

	let onCreditsButton = () => navigation.navigate('Credits')
	let onPrivacyButton = () => navigation.navigate('Privacy')
	let onLegalButton = () => navigation.navigate('Legal')
	let onSourceButton = () =>
		trackedOpenUrl({url: GH_BASE_URL, id: 'ContributingView'})

	let [appThemePreference, setAppThemePreference] = React.useState('system')

	const handleAppThemePreferenceOnChange = async (theme: string) => {
		await storage.setAppThemePreference(theme)
		setAppThemePreference(theme)
		restart.Restart()
	}

	let [openInApplinkPreference, setOpenInAppLinkPreference] =
		React.useState(true)

	const handleOpenLinkOnChange = async (preference: boolean) => {
		await storage.setLinkPreference(preference)
		setOpenInAppLinkPreference(preference)
	}

	React.useEffect(() => {
		async function loadAppLinkPreference() {
			setOpenInAppLinkPreference(await storage.getInAppLinkPreference())
		}

		async function loadAppThemePreferece() {
			setAppThemePreference(await storage.getAppThemePreference())
		}

		Promise.all([loadAppLinkPreference, loadAppThemePreferece])
	}, [])

	return (
		<Section header="MISCELLANY">
			<Cell
				cellAccessoryView={
					<ContextMenu
						actions={['system', 'light', 'dark']}
						isMenuPrimaryAction={true}
						onPressMenuItem={handleAppThemePreferenceOnChange}
						title="Choose a theme for the app."
					>
						<Button title={upperFirst(appThemePreference)} />
					</ContextMenu>
				}
				cellStyle="RightDetail"
				title="App theme"
			/>

			<CellToggle
				label="Open links in-app"
				onChange={handleOpenLinkOnChange}
				value={openInApplinkPreference}
			/>
			<PushButtonCell onPress={onCreditsButton} title="Credits" />
			<PushButtonCell onPress={onPrivacyButton} title="Privacy Policy" />
			<PushButtonCell onPress={onLegalButton} title="Legal" />
			<PushButtonCell
				onPress={onSourceButton}
				showLinkStyle={true}
				title="Contributing"
			/>
		</Section>
	)
}
