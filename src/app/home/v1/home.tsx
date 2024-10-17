import {CELL_MARGIN, HomeScreenButton} from '../../../../source/views/home/button'
import {ScrollView, StyleSheet, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import {Link, useNavigation, useRouter} from 'expo-router'
import {UnofficialAppNotice} from '../../../../source/views/home/notice'
import {Column} from '../../../../source/modules/layout/column'
import * as c from '../../../../source/modules/colors'
import { useLayoutEffect } from 'react'

const styles = StyleSheet.create({
	scrollview: {
		flex: 1,
		backgroundColor: c.systemBackground,
	},
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
	const router = useRouter()
	const navigation = useNavigation()

	useLayoutEffect(() => {
		navigation.setOptions({title: 'All About Olaf'})
	}, [navigation])

	return (
		<SafeAreaView style={styles.scrollview} edges={['left', 'right', 'bottom']}>
			<ScrollView
				alwaysBounceHorizontal={false}
				showsHorizontalScrollIndicator={false}
				showsVerticalScrollIndicator={false}
				testID="screen-homescreen"
			>
				<View style={styles.cells}>
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
				</View>
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
			</ScrollView>
		</SafeAreaView>
	)
}
