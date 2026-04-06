import * as React from 'react'
import {ScrollView, View, StyleSheet} from 'react-native'
import * as c from '@frogpond/colors'
import {HomeScreenButton, HomeScreenLink} from '../views/home/button'
import {OpenSettingsButton} from '@frogpond/navigation-buttons'
import {UnofficialAppNotice} from '../views/home/notice'
import {Stack} from 'expo-router'

const CELL_MARGIN = 10

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	cells: {
		marginInline: CELL_MARGIN,
		paddingBlock: CELL_MARGIN,

		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: CELL_MARGIN,
	},
})

export default function HomePage(): React.ReactNode {
	return (
		<ScrollView
			alwaysBounceHorizontal={false}
			contentContainerStyle={styles.container}
			showsHorizontalScrollIndicator={false}
			testID="screen-homescreen"
		>
			<Stack.Screen
				options={{
					title: 'All About Olaf',
					headerBackTitle: 'Home',
					headerLargeTitleEnabled: false,
					headerRight: () => <OpenSettingsButton />,
				}}
			/>

			<View style={styles.cells}>
				<HomeScreenButton
					foreground="light"
					href="/menus"
					icon="bowl"
					tint={c.grassToLime[0]}
					title="Menus"
				/>

				<HomeScreenButton
					foreground="light"
					href="/sis"
					icon="fingerprint"
					tint={c.yellowToGoldDark[0]}
					title="SIS"
				/>

				<HomeScreenButton
					foreground="light"
					href="/building-hours"
					icon="clock"
					tint={c.lightBlueToBlueDark[0]}
					title="Building Hours"
				/>

				<HomeScreenButton
					foreground="light"
					href="/calendar"
					icon="calendar"
					tint={c.magentaToPurple[0]}
					title="Calendar"
				/>

				<HomeScreenButton
					foreground="light"
					href="/directory"
					icon="v-card"
					tint={c.redToPurple[0]}
					title="Directory"
				/>

				<HomeScreenButton
					foreground="light"
					href="/streaming"
					icon="video"
					tint={c.lightBlueToBlueLight[0]}
					title="Streaming Media"
				/>

				<HomeScreenButton
					foreground="light"
					href="/news"
					icon="news"
					tint={c.purpleToIndigo[0]}
					title="News"
				/>

				<HomeScreenLink
					foreground="light"
					href="https://www.myatlascms.com/map/index.php?id=294"
					icon="map"
					tint={c.navyToNavy[0]}
					title="Campus Map"
				/>

				<HomeScreenButton
					foreground="light"
					href="/contacts"
					icon="phone"
					tint={c.orangeToRed[0]}
					title="Important Contacts"
				/>

				<HomeScreenButton
					foreground="light"
					href="/transportation"
					icon="address"
					tint={c.grayToDarkGray[0]}
					title="Transportation"
				/>

				<HomeScreenButton
					foreground="light"
					href="/dictionary"
					icon="open-book"
					tint={c.pinkToHotpink[0]}
					title="Campus Dictionary"
				/>

				<HomeScreenButton
					foreground="light"
					href="/student-orgs"
					icon="globe"
					tint={c.darkBlueToIndigo[0]}
					title="Student Orgs"
				/>

				<HomeScreenButton
					foreground="light"
					href="/more"
					icon="link"
					tint={c.seafoamToGrass[0]}
					title="More"
				/>

				<HomeScreenButton
					foreground="light"
					href="/stoprint"
					icon="print"
					tint={c.tealToSeafoam[0]}
					title="stoPrint"
				/>

				<HomeScreenButton
					foreground="light"
					href="/sis/course-search"
					icon="graduation-cap"
					tint={c.lavender}
					title="Course Catalog"
				/>

				<HomeScreenLink
					foreground="dark"
					href="https://oleville.com"
					icon="browser"
					tint={c.yellowToGoldMid[0]}
					title="Oleville"
				/>
			</View>

			<UnofficialAppNotice />
		</ScrollView>
	)
}
