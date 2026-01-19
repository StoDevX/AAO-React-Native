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
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.container}
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
					href="/menus"
					title="Menus"
					icon="bowl"
					foreground="light"
					tint={c.grassToLime[0]}
				/>

				<HomeScreenButton
					href="/sis"
					title="SIS"
					icon="fingerprint"
					foreground="light"
					tint={c.yellowToGoldDark[0]}
				/>

				<HomeScreenButton
					href="/building-hours"
					title="Building Hours"
					icon="clock"
					foreground="light"
					tint={c.lightBlueToBlueDark[0]}
				/>

				<HomeScreenButton
					href="/calendar"
					title="Calendar"
					icon="calendar"
					foreground="light"
					tint={c.magentaToPurple[0]}
				/>

				<HomeScreenButton
					href="/directory"
					title="Directory"
					icon="v-card"
					foreground="light"
					tint={c.redToPurple[0]}
				/>

				<HomeScreenButton
					href="/streaming"
					title="Streaming Media"
					icon="video"
					foreground="light"
					tint={c.lightBlueToBlueLight[0]}
				/>

				<HomeScreenButton
					href="/news"
					title="News"
					icon="news"
					foreground="light"
					tint={c.purpleToIndigo[0]}
				/>

				<HomeScreenLink
					href="https://www.myatlascms.com/map/index.php?id=294"
					title="Campus Map"
					icon="map"
					foreground="light"
					tint={c.navyToNavy[0]}
				/>

				<HomeScreenButton
					href="/contacts"
					title="Important Contacts"
					icon="phone"
					foreground="light"
					tint={c.orangeToRed[0]}
				/>

				<HomeScreenButton
					href="/transportation"
					title="Transportation"
					icon="address"
					foreground="light"
					tint={c.grayToDarkGray[0]}
				/>

				<HomeScreenButton
					href="/dictionary"
					title="Campus Dictionary"
					icon="open-book"
					foreground="light"
					tint={c.pinkToHotpink[0]}
				/>

				<HomeScreenButton
					href="/student-orgs"
					title="Student Orgs"
					icon="globe"
					foreground="light"
					tint={c.darkBlueToIndigo[0]}
				/>

				<HomeScreenButton
					href="/more"
					title="More"
					icon="link"
					foreground="light"
					tint={c.seafoamToGrass[0]}
				/>

				<HomeScreenButton
					href="/stoprint"
					title="stoPrint"
					icon="print"
					foreground="light"
					tint={c.tealToSeafoam[0]}
				/>

				<HomeScreenButton
					href="/sis/course-search"
					title="Course Catalog"
					icon="graduation-cap"
					foreground="light"
					tint={c.lavender}
				/>

				<HomeScreenLink
					href="https://oleville.com"
					title="Oleville"
					icon="browser"
					foreground="dark"
					tint={c.yellowToGoldMid[0]}
				/>
			</View>

			<UnofficialAppNotice />
		</ScrollView>
	)
}
