import * as React from 'react'
import {ScrollView, StyleSheet} from 'react-native'

import {AllViews, type ViewType} from '../views'
import {FaqBannerGroup} from '../faqs'
import {FAQ_TARGETS} from '../faqs/constants'
import {CELL_MARGIN} from './button'
import {HomeScreenGrid} from './grid'
import {HomeScreenTile} from './tile'
import {DEFAULT_TILE_SIZE} from './types'
import {OpenSettingsButton} from '@frogpond/navigation-buttons'
import {UnofficialAppNotice} from './notice'
import {useSelector} from 'react-redux'
import type {RootState} from '../../redux/store'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

const styles = StyleSheet.create({
	banner: {
		marginHorizontal: CELL_MARGIN,
		marginTop: CELL_MARGIN,
		marginBottom: CELL_MARGIN / 2,
	},
})

function HomePage(): React.ReactNode {
	const allViews = React.useMemo(
		() => AllViews().filter((view) => !view.disabled),
		[],
	)

	const sizes = useSelector(
		(state: RootState) => state.settings.homescreenSizes,
	)
	const sizeOf = React.useCallback(
		(view: ViewType) => sizes[view.id] ?? DEFAULT_TILE_SIZE,
		[sizes],
	)

	return (
		<ScrollView
			alwaysBounceHorizontal={false}
			contentInsetAdjustmentBehavior="automatic"
			showsHorizontalScrollIndicator={false}
			showsVerticalScrollIndicator={false}
			testID="screen-homescreen"
		>
			<FaqBannerGroup style={styles.banner} target={FAQ_TARGETS.HOME} />

			<HomeScreenGrid
				views={allViews}
				sizeOf={sizeOf}
				renderTile={(packed) => <HomeScreenTile view={packed.view} />}
			/>

			<UnofficialAppNotice />
		</ScrollView>
	)
}

export {HomePage as View}

export const NavigationKey = 'Home'

export const NavigationOptions: NativeStackNavigationOptions = {
	title: 'All About Olaf',
	headerBackTitle: 'Home',
	headerRight: (props) => <OpenSettingsButton {...props} />,
}

export type NavigationParams = undefined
