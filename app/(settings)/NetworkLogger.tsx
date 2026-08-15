import * as React from 'react'
import {StyleSheet, View, Text, TouchableOpacity, useColorScheme} from 'react-native'
import {Button} from '@frogpond/button'
import NetworkLogger, {getBackHandler} from 'react-native-network-logger'
import * as c from '@frogpond/colors'
import {Stack, useNavigation} from 'expo-router'

export default function NetworkLoggerPage(): React.ReactNode {
	const navigation = useNavigation()

	const goBack = () => setUnmountNetworkLogger(true)
	const [unmountNetworkLogger, setUnmountNetworkLogger] = React.useState(false)
	const backHandler = getBackHandler(goBack)

	const scheme = useColorScheme()
	const themeMode = scheme === 'dark' ? 'dark' : 'light'

	const remountButton = (
		<Button onPress={() => setUnmountNetworkLogger(false)} title="Re-open the network logger" />
	)

	return (
		<>
			<Stack.Screen options={{presentation: 'modal', gestureEnabled: false}} />
			<Stack.Title>Network Logger</Stack.Title>
			<Stack.Toolbar placement="right">
				<Stack.Toolbar.Button
					accessibilityLabel="Close Screen"
					icon="xmark"
					onPress={() => navigation.goBack()}
				/>
			</Stack.Toolbar>

			<View style={styles.header}>
				<TouchableOpacity hitSlop={styles.hitSlop} onPress={backHandler} style={styles.navButton}>
					<Text style={styles.backButtonText}>‹</Text>
				</TouchableOpacity>

				<Text accessibilityRole="header" style={styles.title}>
					react-native-network-logger
				</Text>

				<View style={styles.navButton} />
			</View>

			{(unmountNetworkLogger && remountButton) || <NetworkLogger theme={themeMode} />}
		</>
	)
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
		color: c.label,
		paddingHorizontal: 20,
		fontSize: 30,
		fontWeight: 'bold',
	},
	title: {
		flex: 5,
		color: c.label,
		textAlign: 'center',
		padding: 10,
		fontSize: 18,
		fontWeight: 'bold',
	},
})
