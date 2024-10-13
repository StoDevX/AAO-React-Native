import {CELL_MARGIN, HomeScreenButton} from '../source/views/home/button'
import {ScrollView, StyleSheet, View} from 'react-native'
import {AllViews} from '../source/views/views'
import {SafeAreaView} from 'react-native-safe-area-context'
import {genericOpenUrl, openUrl} from '../modules/open-url/open-url'
import {useNavigation} from 'expo-router'
import {UnofficialAppNotice} from '../source/views/home/notice'
import {partitionByIndex} from '../source/lib/partition-by-index'
import {Column} from '../modules/layout/column'

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

export default function Index() {
	const navigation = useNavigation()
	let allViews = AllViews().filter((view) => !view.disabled)
	let columns = partitionByIndex(allViews)

	return (
		<ScrollView
			alwaysBounceHorizontal={false}
			showsHorizontalScrollIndicator={false}
			showsVerticalScrollIndicator={false}
			testID="screen-homescreen"
		>
			<SafeAreaView edges={['left', 'right', 'bottom']}>
				<View style={styles.cells}>
					{columns.map((contents, i) => (
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
					))}
				</View>

				<UnofficialAppNotice />
			</SafeAreaView>
		</ScrollView>
	)
}
