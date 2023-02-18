import * as React from 'react'
import {
	ImageBackground,
	StyleSheet,
	useWindowDimensions,
	View,
} from 'react-native'
import {
	useAppBackground,
	useUpdateAppBackground,
} from '../../../../home/background'
import * as c from '@frogpond/colors'
import {useNavigation} from '@react-navigation/native'
import {RightHomeContextMenu} from '../../../../home/right-button'

const BackgroundExample = (): JSX.Element => {
	let {height} = useWindowDimensions()

	const styles = StyleSheet.create({
		default: {
			backgroundColor: c.systemBackground,
			height: height,
		},
		background: {
			flex: 1,
			height: height,
		},
	})

	let navigation = useNavigation()

	let {data: appBackgroundImage} = useAppBackground()
	const appBackground = useUpdateAppBackground()

	const SettingsContextButton = React.useMemo(
		() => <RightHomeContextMenu callback={appBackground.mutate} />,
		[appBackground],
	)

	React.useLayoutEffect(() => {
		navigation.setOptions({
			headerRight: () => SettingsContextButton,
		})
	}, [SettingsContextButton, navigation])

	return appBackgroundImage ? (
		<ImageBackground
			resizeMode="cover"
			source={{uri: appBackgroundImage}}
			style={styles.background}
		/>
	) : (
		<View style={styles.default} />
	)
}

export const BackgroundLibrary = (): JSX.Element => <BackgroundExample />
