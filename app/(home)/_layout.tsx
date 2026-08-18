import * as React from 'react'
import {Stack} from 'expo-router'
import {headerColorsFor} from '../../source/navigation/header-colors'

export default function HomeLayout(): React.ReactNode {
	return (
		<Stack screenOptions={{headerBackButtonDisplayMode: 'minimal'}}>
			<Stack.Screen name="index" options={{headerShown: false}} />
			<Stack.Screen name="Menus" options={{title: 'Menus', ...headerColorsFor('Menus')}} />
			<Stack.Screen name="MenuItemDetail" options={headerColorsFor('Menus')} />
			<Stack.Screen name="CarletonBurtonMenu" options={headerColorsFor('Menus')} />
			<Stack.Screen name="CarletonLDCMenu" options={headerColorsFor('Menus')} />
			<Stack.Screen name="CarletonSaylesMenu" options={headerColorsFor('Menus')} />
			<Stack.Screen name="CarletonWeitzMenu" options={headerColorsFor('Menus')} />
			<Stack.Screen
				name="Streaming Media"
				options={{title: 'Streaming Media', ...headerColorsFor('Streaming Media')}}
			/>
			<Stack.Screen name="KSTOSchedule" options={headerColorsFor('Streaming Media')} />
			<Stack.Screen name="KRLXSchedule" options={headerColorsFor('Streaming Media')} />
			<Stack.Screen name="News" options={{title: 'News', ...headerColorsFor('News')}} />
			<Stack.Screen
				name="Transportation"
				options={{title: 'Transportation', ...headerColorsFor('Transportation')}}
			/>
			<Stack.Screen name="BusRouteDetail" options={headerColorsFor('Transportation')} />
			<Stack.Screen name="BuildingHours" options={headerColorsFor('BuildingHours')} />
			<Stack.Screen name="BuildingHours/[name]" options={headerColorsFor('BuildingHours')} />
			<Stack.Screen
				name="BuildingHoursProblemReport"
				options={{presentation: 'modal', gestureEnabled: false}}
			/>
			<Stack.Screen name="BuildingHoursScheduleEditor" options={{presentation: 'modal'}} />
			<Stack.Screen name="Communities" options={headerColorsFor('Communities')} />
			<Stack.Screen name="RedditPostDetail" options={headerColorsFor('Communities')} />
			<Stack.Screen name="Map" options={{title: 'Carleton Map', ...headerColorsFor('Map')}} />
			<Stack.Screen name="SIS" options={{title: 'SIS', ...headerColorsFor('SIS')}} />
			<Stack.Screen name="JobDetail" options={headerColorsFor('SIS')} />
			<Stack.Screen name="CourseDetail" options={headerColorsFor('CourseSearch')} />
			<Stack.Screen name="CourseSearchResults" options={headerColorsFor('CourseSearch')} />
			<Stack.Screen
				name="EventDetail"
				options={{presentation: 'modal', title: '', headerTransparent: true}}
			/>
			<Stack.Screen name="Calendar" options={{title: 'Calendar', ...headerColorsFor('Calendar')}} />
			<Stack.Screen name="Directory" options={headerColorsFor('Directory')} />
			<Stack.Screen name="Directory/[index]" options={headerColorsFor('Directory')} />
			<Stack.Screen name="Contacts" options={headerColorsFor('Contacts')} />
			<Stack.Screen name="Contacts/[title]" options={headerColorsFor('Contacts')} />
			<Stack.Screen name="Dictionary" options={headerColorsFor('Dictionary')} />
			<Stack.Screen name="Dictionary/[word]" options={headerColorsFor('Dictionary')} />
			<Stack.Screen name="Dictionary/[word]/edit" options={headerColorsFor('Dictionary')} />
			<Stack.Screen name="StudentOrgs" options={headerColorsFor('StudentOrgs')} />
			<Stack.Screen name="StudentOrgs/[name]" options={headerColorsFor('StudentOrgs')} />
			<Stack.Screen name="PrintJobs" options={headerColorsFor('PrintJobs')} />
			<Stack.Screen name="PrintJobs/[jobId]" options={headerColorsFor('PrintJobs')} />
			<Stack.Screen name="PrintJobs/[jobId]/printers" options={headerColorsFor('PrintJobs')} />
			<Stack.Screen name="PrintJobs/[jobId]/release" options={headerColorsFor('PrintJobs')} />
			<Stack.Screen name="More" options={headerColorsFor('More')} />
			<Stack.Screen name="Faq" options={headerColorsFor('Faq')} />
			<Stack.Screen name="CourseSearch" options={headerColorsFor('CourseSearch')} />
		</Stack>
	)
}
