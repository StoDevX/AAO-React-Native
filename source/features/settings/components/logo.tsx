import React from 'react'
import {StyleProp, ImageStyle, Image, StyleSheet, ImageProps} from 'react-native'
import {getIcon} from 'react-native-change-icon'
import {DEFAULT_ICON, appIcons, iconFor} from '../../../../images/icons'

const styles = StyleSheet.create({
	logoImage: {
		width: 100,
		height: 100,
		alignSelf: 'center',
	},
})

export const LogoImage = (props: ImageProps): React.ReactNode => (
	<Image {...props} style={[styles.logoImage, props.style]} />
)

type Props = {
	style?: StyleProp<ImageStyle>
}

export let AppLogo = (props: Props): React.ReactNode => {
	let [icon, setIcon] = React.useState(DEFAULT_ICON)

	React.useEffect(() => {
		getIcon().then((name: string) => {
			setIcon(iconFor(name))
		})
	}, [])

	return (
		<LogoImage
			accessibilityIgnoresInvertColors={true}
			source={appIcons[icon].logo}
			style={props.style}
		/>
	)
}
