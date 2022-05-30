import * as React from 'react'
import {StyleProp, ImageStyle} from 'react-native'
import * as Icons from '@hawkrives/react-native-alternate-icons'
import glamorous from 'glamorous-native'

import {lookup as getAppIcon} from '../../../../images/icons/index'

const LogoImage = glamorous.image({
	width: 100,
	height: 100,
	alignSelf: 'center',
})

type Props = {
	style?: StyleProp<ImageStyle>
}

export let AppLogo = (props: Props): JSX.Element => {
	let [icon, setIcon] = React.useState(getAppIcon('default'))

	React.useEffect(() => {
		Icons.getIconName().then((name: string) => {
			setIcon(getAppIcon(name))
		})
	}, [])

	return (
		<LogoImage
			accessibilityIgnoresInvertColors={true}
			source={icon}
			style={props.style}
		/>
	)
}
