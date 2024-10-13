import React from 'react'
import {
	StyleProp,
	ImageStyle,
	Image,
	StyleSheet,
	ImageProps,
} from 'react-native'
import * as Icons from '@hawkrives/react-native-alternate-icons'
import {lookup as getAppIcon} from '../../../../images/icons/index'

const styles = StyleSheet.create({
	logoImage: {
		width: 100,
		height: 100,
		alignSelf: 'center',
	},
})

export const LogoImage = (props: ImageProps): React.JSX.Element => (
	<Image {...props} style={[styles.logoImage, props.style]} />
)

interface Props {
	style?: StyleProp<ImageStyle>
}

export let AppLogo = (props: Props): React.JSX.Element => {
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
