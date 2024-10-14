import {CELL_MARGIN, HomeScreenButton} from '../../../../source/views/home/button'
import {ScrollView, StyleSheet} from 'react-native'
// import {AllViews} from '../../source/views/views'
import {SafeAreaView} from 'react-native-safe-area-context'
// import {genericOpenUrl, openUrl} from '../../modules/open-url/open-url'
import {Link, useNavigation, useRouter} from 'expo-router'
import {UnofficialAppNotice} from '../../../../source/views/home/notice'
// import {partitionByIndex} from '../../source/lib/partition-by-index'
import {Column} from '../../../../source/modules/layout/column'
import type React from 'react'
import * as c from '../../../../source/modules/colors'
import { useLayoutEffect } from 'react'

const styles = StyleSheet.create({
	cells: {
		marginHorizontal: CELL_MARGIN / 2,
		paddingTop: CELL_MARGIN,

		flexDirection: 'row',
	},
	column: {
		flex: 1,
	},
})

export default function HomeScreenView(): React.JSX.Element {
	// let allViews = AllViews().filter((view) => !view.disabled)
	// let columns = partitionByIndex(allViews)
	const router = useRouter()
    const navigation = useNavigation()

	useLayoutEffect(() => {
        navigation.setOptions({title: 'All About Olaf'})
    }, [navigation])

	return (
		<ScrollView
			alwaysBounceHorizontal={false}
			showsHorizontalScrollIndicator={false}
			showsVerticalScrollIndicator={false}
			testID="screen-homescreen"
		>
			<SafeAreaView edges={['left', 'right', 'bottom']} style={styles.cells}>
				<Column style={styles.column}>
					<HomeScreenButton
						title="Menus"
						iconName="bowl"
						foreground="light"
						tintColor="#7CBB00"
						onPress={() => {
							router.navigate('/menu')
						}}
					/>
				</Column>
				<Column style={styles.column}>
					<HomeScreenButton
						title="Transportation"
						iconName="address"
						foreground="light"
						tintColor={c.grayToDarkGray[0]}
						onPress={() => {
							router.navigate('/transportation')
						}}
					/>
				</Column>
				{/* {columns.map((contents, i) => (
						<Column key={i} style={styles.column}>
							{contents.map((view) => (
								<HomeScreenButton
									key={view.type === 'view' ? view.view : view.title}
									onPress={() => {
										if (view.type === 'url') {
											return openUrl(view.url)
										} else if (view.type === 'browser-url') {
											return genericOpenUrl(view.url)
										} else if (view.type === 'view') {
											return navigation.navigate(view.view)
										} else {
											throw new Error(`unexpected view type ${view.type}`)
										}
									}}
									view={view}
									style={{}}
								/>
							))}
						</Column>
					))} */}

				<UnofficialAppNotice />
			</SafeAreaView>
		</ScrollView>
	)
}
