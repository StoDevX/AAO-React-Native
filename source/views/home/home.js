// @flow

import * as React from 'react'
import {ScrollView, View, StatusBar} from 'react-native'
import {TableView, Section, Cell} from '@frogpond/tableview'
import {withNavigation, SafeAreaView} from 'react-navigation'
import Icon from 'react-native-vector-icons/Entypo'
import {getTheme} from '@frogpond/app-theme'
import {type NavType} from '../types'
import {openUrl, openUrlInBrowser} from '@frogpond/open-url'
import {OpenSettingsButton} from '@frogpond/navigation-buttons'
import {UnofficialAppNotice} from './notice'
import * as c from '@frogpond/colors'

let iconSize = 29
let separatorInset = 15 + iconSize + 15

function HomePage() {
	let {androidStatusBarColor, statusBarStyle} = getTheme()

	return (
		<ScrollView testID="screen-homescreen">
			<StatusBar
				backgroundColor={androidStatusBarColor}
				barStyle={statusBarStyle}
			/>

			<SafeAreaView>
				<TableView>
					<Section header=" " separatorInsetLeft={separatorInset}>
						<ViewHomeCell
							foreground="light"
							icon="bowl"
							tint={c.iosGreen}
							title="Menus"
							view="MenusView"
						/>

						<UrlHomeCell
							external={true}
							foreground="light"
							icon="warning"
							tint={c.iosBlue}
							title="Safety & Wellness"
							url="https://wp.stolaf.edu/safety-committee/report/"
							view="SafetyView"
						/>

						<ViewHomeCell
							foreground="light"
							icon="clock"
							tint={c.iosPurple}
							title="Building Hours"
							view="BuildingHoursView"
						/>

						<UrlHomeCell
							external={true}
							foreground="dark"
							icon="warning"
							tint={c.iosYellow}
							title="Emergency"
							url="https://wp.stolaf.edu/safety-committee/report/"
							view="SafetyView"
						/>
					</Section>

					<Section header="OLES" separatorInsetLeft={separatorInset}>
						<UrlHomeCell
							foreground="dark"
							icon="graduation-cap"
							tint={c.iosOrange}
							title="Moodle"
							url="https://moodle.stolaf.edu/"
						/>

						<ViewHomeCell
							foreground="dark"
							icon="funnel"
							tint={c.iosOrange}
							title="Course Search"
							view="CourseSearchView"
						/>

						<ViewHomeCell
							foreground="dark"
							icon="credit-card"
							tint={c.iosOrange}
							title="OleCard Balances"
							view="BalancesOrAcknowledgementView"
						/>

						<ViewHomeCell
							foreground="light"
							icon="print"
							tint={c.iosGreen}
							title="stoPrint"
							view="PrintJobsView"
						/>

						<UrlHomeCell
							foreground="dark"
							icon="hour-glass"
							tint={c.iosOrange}
							title="Time Entry"
							url="https://www.stolaf.edu/apps/tes/index.cfm"
						/>

						<ViewHomeCell
							foreground="light"
							icon="man"
							tint={c.iosBlue}
							title="Student Work Jobs"
							view="StudentWorkView"
						/>

						<UrlHomeCell
							foreground="light"
							icon="v-card"
							tint={c.iosPurple}
							title="Directory"
							url="https://www.stolaf.edu/personal/index.cfm"
						/>
					</Section>

					<Section header="EVENTS" separatorInsetLeft={separatorInset}>
						<ViewHomeCell
							foreground="light"
							icon="calendar"
							tint={c.iosPink}
							title="Calendar"
							view="CalendarView"
						/>

						<ViewHomeCell
							foreground="light"
							icon="video"
							tint={c.iosPurple}
							title="Streaming Media"
							view="StreamingView"
						/>

						<ViewHomeCell
							foreground="light"
							icon="video"
							tint={c.iosTealBlue}
							title="Radio / KSTO"
							view="StreamingView"
						/>
					</Section>

					<Section header="PLACES" separatorInsetLeft={separatorInset}>
						<UrlHomeCell
							foreground="light"
							icon="map"
							tint={c.iosGreen}
							title="Campus Map"
							url="https://www.myatlascms.com/map/index.php?id=294"
						/>

						<ViewHomeCell
							foreground="light"
							icon="address"
							tint={c.iosRed}
							title="Express Bus"
							view="TransportationView"
						/>

						<ViewHomeCell
							foreground="dark"
							icon="address"
							tint={c.iosYellow}
							title="Around Northfield"
							view="TransportationView"
						/>

						<ViewHomeCell
							foreground="dark"
							icon="address"
							tint={c.iosYellow}
							title="Outside Northfield"
							view="TransportationView"
						/>
					</Section>

					<Section header="NEWS" separatorInsetLeft={separatorInset}>
						<ViewHomeCell
							foreground="light"
							icon="news"
							tint={c.iosBlue}
							title="Student Senate"
							view="NewsView"
						/>

						<ViewHomeCell
							foreground="dark"
							icon="news"
							tint="#E3A025"
							title="Official St. Olaf News"
							view="NewsView"
						/>

						<ViewHomeCell
							foreground="light"
							icon="news"
							tint={c.iosTealBlue}
							title="The Manitou Messenger"
							view="NewsView"
						/>

						<ViewHomeCell
							foreground="light"
							icon="news"
							tint={c.iosBlue}
							title="Oleville"
							view="NewsView"
						/>
					</Section>

					<Section header="AROUND THE HILL" separatorInsetLeft={separatorInset}>
						<ViewHomeCell
							foreground="dark"
							icon="open-book"
							tint={c.iosYellow}
							title="Campus Dictionary"
							view="DictionaryView"
						/>

						<ViewHomeCell
							foreground="light"
							icon="globe"
							tint={c.iosGreen}
							title="Student Orgs"
							view="StudentOrgsView"
						/>
					</Section>
				</TableView>

				<UnofficialAppNotice />
			</SafeAreaView>
		</ScrollView>
	)
}
HomePage.navigationOptions = ({navigation}) => {
	return {
		title: 'All About Olaf',
		headerBackTitle: 'Home',
		headerLeft: <OpenSettingsButton navigation={navigation} />,
		//headerRight: <EditHomeButton navigation={navigation} />,
	}
}

let ViewHomeCell = withNavigation(function(props: {
	view: string,
	title: string,
	icon: string,
	foreground: 'light' | 'dark',
	tint: string,
	navigation: NavType,
}) {
	let {navigation, view, title, icon, foreground, tint} = props

	return (
		<BaseHomeCell
			foreground={foreground}
			iconName={icon}
			onPress={() => navigation.navigate(view)}
			tint={tint}
			title={title}
		/>
	)
})

function UrlHomeCell(props: {
	url: string,
	title: string,
	icon: string,
	foreground: 'light' | 'dark',
	tint: string,
	external?: boolean,
}) {
	let {url, external, title, icon, foreground, tint} = props

	let handlePress = () => {
		if (external) {
			return openUrlInBrowser(url)
		} else {
			return openUrl(url)
		}
	}

	return (
		<BaseHomeCell
			foreground={foreground}
			iconName={icon}
			onPress={handlePress}
			tint={tint}
			title={title}
		/>
	)
}

function BaseHomeCell(props: {
	title: string,
	iconName: string,
	foreground: 'light' | 'dark',
	tint: string,
	onPress: () => mixed,
}) {
	let {onPress, title, iconName, foreground, tint} = props

	let icon = (
		<CellIcon background={tint} foreground={foreground} name={iconName} />
	)

	return (
		<Cell
			accessory="DisclosureIndicator"
			cellStyle="Basic"
			disableImageResize={true}
			image={icon}
			onPress={onPress}
			title={title}
		/>
	)
}

function CellIcon(props: {
	name: string,
	background: string,
	foreground: string,
}) {
	let {name, background, foreground} = props

	let fg = 'white'
	if (foreground === 'dark') {
		fg = 'black'
	}

	let size = iconSize

	return (
		<View
			style={{
				backgroundColor: background,
				alignItems: 'center',
				justifyContent: 'center',
				padding: 4,
				borderRadius: 4,
				width: size,
				height: size,
			}}
		>
			<Icon color={fg} name={name} size={18} />
		</View>
	)
}

export default HomePage
