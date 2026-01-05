import * as React from 'react'
import * as Icons from '@hawkrives/react-native-alternate-icons'
import {IconSettingsView} from '../change-icon'

export const AppIconSection = (): JSX.Element | null => {
	let [canChangeIcon, setCanChangeIcon] = React.useState(false)

	let checkIfCustomIconsSupported = async () => {
		let canChange = await Icons.isSupported()
		setCanChangeIcon(canChange)
	}

	React.useEffect(() => {
		checkIfCustomIconsSupported()
	}, [])

	return canChangeIcon ? <IconSettingsView /> : null
}
