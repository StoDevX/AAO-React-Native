import * as React from 'react'
import {StyleSheet, Platform, View, Text, TouchableOpacity} from 'react-native'
import {Button} from '@frogpond/button'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'
import NetworkLogger, {getBackHandler} from 'react-native-network-logger'
import {CloseScreenButton} from '@frogpond/navigation-buttons'
import * as c from '@frogpond/colors'

export const NetworkLoggerView = (): JSX.Element => {
	const goBack = () => setUnmountNetworkLogger(true)
	const [unmountNetworkLogger, setUnmountNetworkLogger] = React.useState(false)
	const backHandler = getBackHandler(goBack)

	const remountButton = (
		<Button
			onPress={() => setUnmountNetworkLogger(false)}
			title="Re-open the network logger"
		/>
	)

	return (
		<>
			<View style={styles.header}>
				<TouchableOpacity
					hitSlop={styles.hitSlop}
					onPress={backHandler}
					style={styles.navButton}
				>
					<Text style={styles.backButtonText}>‹</Text>
				</TouchableOpacity>

				<Text accessibilityRole="header" style={styles.title}>
					react-native-network-logger
				</Text>

				<View style={styles.navButton} />
			</View>

			{(unmountNetworkLogger && remountButton) || <NetworkLogger />}
		</>
	)
}

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'Network Logger',
	headerRight: () => Platform.OS === 'ios' && <CloseScreenButton />,
	presentation: 'modal',
	gestureEnabled: false,
}

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
	},
	navButton: {
		flex: 1,
	},
	hitSlop: {
		top: 20,
		left: 20,
		bottom: 20,
		right: 20,
	},
	backButtonText: {
		color: c.black,
		paddingHorizontal: 20,
		fontSize: 30,
		fontWeight: 'bold',
	},
	title: {
		flex: 5,
		color: c.black,
		textAlign: 'center',
		padding: 10,
		fontSize: 18,
		fontWeight: 'bold',
	},
})
