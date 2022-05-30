import * as React from 'react'
import * as Icons from '@hawkrives/react-native-alternate-icons'
import {IconSettingsView} from '../change-icon'

export let AppIconSection = (): JSX.Element => {
	let [canChangeIcon, setCanChangeIcon] = React.useState(false)

	React.useEffect(() => {
		checkIfCustomIconsSupported()
	}, [])

	let checkIfCustomIconsSupported = async () => {
		let canChangeIcon = await Icons.isSupported()
		setCanChangeIcon(canChangeIcon)
	}

	return canChangeIcon ? <IconSettingsView /> : <></>
}
