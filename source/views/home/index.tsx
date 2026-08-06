import * as React from 'react'
import {ScrollView, StyleSheet} from 'react-native'
import {Host, HStack, VStack} from '@expo/ui/swift-ui'
import {frame, padding} from '@expo/ui/swift-ui/modifiers'

import {AllViews} from '../views'
import {FaqBannerGroup} from '../faqs'
import {FAQ_TARGETS} from '../faqs/constants'
import {partitionByIndex} from '../../lib/partition-by-index'
import {CELL_MARGIN, FILL_WIDTH, HomeScreenButton} from './button'
import {openUrl} from '@frogpond/open-url'
import {OpenSettingsButton} from '@frogpond/navigation-buttons'
import {UnofficialAppNotice} from './notice'
import {useIsDevMode} from '../../lib/use-is-dev-mode'
import {useNavigation} from '@react-navigation/native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

const styles = StyleSheet.create({
	banner: {
		marginHorizontal: CELL_MARGIN,
		marginTop: CELL_MARGIN,
		marginBottom: CELL_MARGIN / 2,
	},
})

function HomePage(): React.ReactNode {
	let navigation = useNavigation()
	let isDev = useIsDevMode()
	let allViews = AllViews().filter(
		(view) => !view.disabled && (isDev || !view.devOnly),
	)
	let columns = partitionByIndex(allViews)

	return (
		<ScrollView
			alwaysBounceHorizontal={false}
			contentInsetAdjustmentBehavior="automatic"
			showsHorizontalScrollIndicator={false}
			showsVerticalScrollIndicator={false}
			testID="screen-homescreen"
		>
			<FaqBannerGroup style={styles.banner} target={FAQ_TARGETS.HOME} />

			<Host matchContents={{horizontal: false, vertical: true}}>
				<VStack
					modifiers={[
						padding({all: CELL_MARGIN}),
						frame({maxWidth: FILL_WIDTH}),
					]}
					spacing={CELL_MARGIN}
				>
					<HStack alignment="top" spacing={CELL_MARGIN}>
						{columns.map((contents, i) => (
							<VStack
								key={i}
								modifiers={[frame({maxWidth: FILL_WIDTH})]}
								spacing={CELL_MARGIN}
							>
								{contents.map((view) => (
									<HomeScreenButton
										key={view.type === 'view' ? view.view : view.title}
										onPress={() => {
											if (view.type === 'url') {
												return openUrl(view.url)
											} else if (view.type === 'view') {
												return navigation.navigate(view.view)
											} else {
												throw new Error(`unexpected view type ${view.type}`)
											}
										}}
										view={view}
									/>
								))}
							</VStack>
						))}
					</HStack>

					<UnofficialAppNotice />
				</VStack>
			</Host>
		</ScrollView>
	)
}

export {HomePage as View}

export const NavigationKey = 'Home'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'All About Olaf',
	headerRight: (props) => <OpenSettingsButton {...props} />,
}

export type NavigationParams = undefined
