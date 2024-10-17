import * as React from 'react'
import * as Icons from '@hawkrives/react-native-alternate-icons'
import {IconSettingsView} from '../change-icon'

export const AppIconSection = (): React.JSX.Element | null => {
	let [canChangeIcon, setCanChangeIcon] = React.useState(false)

	React.useEffect(() => {
		checkIfCustomIconsSupported()
	}, [])

	let checkIfCustomIconsSupported = async () => {
		let canChange = await Icons.isSupported()
		setCanChangeIcon(canChange)
	}

	return canChangeIcon ? <IconSettingsView /> : null
}
