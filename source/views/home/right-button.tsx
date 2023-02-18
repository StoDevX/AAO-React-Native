import * as React from 'react'
import {OpenSettingsButton} from '@frogpond/navigation-buttons'
import {ContextMenu} from '@frogpond/context-menu'
import {useNavigation} from '@react-navigation/native'
import {UseMutateFunction} from '@tanstack/react-query'

const HomeNavbarButtonsEnum = {
	Settings: 'Settings',
	ChangeBackground: 'Change Background',
}

type MutationCallback = {
	callback: UseMutateFunction<string | undefined, unknown, void, unknown>
}

export const RightHomeContextMenu = ({
	callback,
}: MutationCallback): JSX.Element => {
	let navigation = useNavigation()

	const onPressMenuItem = (result: string) => {
		const typedResult = result as keyof typeof HomeNavbarButtonsEnum
		switch (typedResult) {
			case HomeNavbarButtonsEnum.Settings:
				navigation.navigate('Settings')
				break
			case HomeNavbarButtonsEnum.ChangeBackground: {
				callback?.()
				break
			}
			default:
				console.warn(`Unhandled tap on settings button item: ${result}`)
				break
		}
	}

	return (
		<ContextMenu
			accessibilityLabel="Settings and background preferences."
			actions={Object.values(HomeNavbarButtonsEnum)}
			isMenuPrimaryAction={true}
			onPressMenuItem={onPressMenuItem}
			testId="button-open-settings"
			title=""
		>
			<OpenSettingsButton canGoBack={true} />
		</ContextMenu>
	)
}
