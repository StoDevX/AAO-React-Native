import {describe, expect, it, jest, beforeEach} from '@jest/globals'
import * as React from 'react'
import {render, fireEvent} from '@testing-library/react-native'

// Capture Stack.Screen options from renders — prefixed with "mock" so jest.mock can access it
let mockCapturedScreenOptions: Array<{title?: string}> = []

// Shared mock for router.push — prefixed with "mock" so jest.mock can access it
const mockRouterPush = jest.fn()

// Mock expo-router
jest.mock('expo-router', () => {
	const React = require('react')
	const {View} = require('react-native')
	return {
		Stack: {
			Screen: ({options}: {options?: {title?: string}}) => {
				mockCapturedScreenOptions.push(options ?? {})
				return React.createElement(View)
			},
		},
		Link: ({
			href,
			children,
			...props
		}: {
			href: string
			children: React.ReactNode
			[key: string]: unknown
		}) =>
			React.createElement(
				View,
				{accessibilityLabel: props['aria-label'], testID: `link-${href}`},
				children,
			),
		useRouter: () => ({
			push: mockRouterPush,
			back: jest.fn(),
		}),
		useNavigation: () => ({
			setOptions: jest.fn(),
		}),
		useLocalSearchParams: () => ({}),
	}
})

// Mock expo-router/unstable-native-tabs
jest.mock('expo-router/unstable-native-tabs', () => {
	const React = require('react')
	const {View, Text} = require('react-native')
	const NativeTabs = ({children}: {children: React.ReactNode}) =>
		React.createElement(View, {testID: 'native-tabs'}, children)
	NativeTabs.Trigger = ({
		name,
		children,
	}: {
		name: string
		children: React.ReactNode
	}) => React.createElement(View, {testID: `tab-trigger-${name}`}, children)
	return {
		NativeTabs,
		Icon: () => null,
		Label: ({children}: {children: string}) =>
			React.createElement(Text, {testID: `tab-label-${children}`}, children),
	}
})

// Mock @react-native-vector-icons
jest.mock('@react-native-vector-icons/entypo', () => {
	const React = require('react')
	const {View} = require('react-native')
	return {
		Entypo: () => React.createElement(View),
		EntypoIconName: '',
	}
})

jest.mock('@react-native-vector-icons/ionicons', () => {
	const React = require('react')
	const {View} = require('react-native')
	return {
		Ionicons: () => React.createElement(View),
	}
})

jest.mock('@react-native-vector-icons/material-design-icons', () => {
	const React = require('react')
	const {View} = require('react-native')
	return () => React.createElement(View)
})

// Mock @frogpond modules
jest.mock('@frogpond/colors', () => ({
	systemBackground: '#fff',
	label: '#000',
	grassToLime: ['#0f0'],
	yellowToGoldDark: ['#ff0'],
	lightBlueToBlueDark: ['#00f'],
	magentaToPurple: ['#f0f'],
	redToPurple: ['#f00'],
	lightBlueToBlueLight: ['#0ff'],
	purpleToIndigo: ['#a0f'],
	navyToNavy: ['#009'],
	orangeToRed: ['#f60'],
	grayToDarkGray: ['#888'],
	pinkToHotpink: ['#f0a'],
	darkBlueToIndigo: ['#00a'],
	seafoamToGrass: ['#0fa'],
	tealToSeafoam: ['#0ff'],
	lavender: '#c0f',
	yellowToGoldMid: ['#fd0'],
	systemFill: '#ccc',
	placeholderText: '#999',
}))

jest.mock('@frogpond/navigation-buttons', () => {
	const React = require('react')
	const {View} = require('react-native')
	return {
		OpenSettingsButton: () => React.createElement(View),
		CloseScreenButton: () => React.createElement(View),
	}
})

jest.mock('@frogpond/open-url', () => ({
	openUrl: jest.fn(),
}))

jest.mock('@frogpond/notice', () => {
	const React = require('react')
	const {View} = require('react-native')
	return {
		LoadingView: () => React.createElement(View),
		NoticeView: () => React.createElement(View),
	}
})

jest.mock('@frogpond/lists', () => {
	const React = require('react')
	const {View, Text} = require('react-native')
	return {
		ListSeparator: () => React.createElement(View),
		ListSectionHeader: ({title}: {title: string}) =>
			React.createElement(Text, null, title),
	}
})

jest.mock('@frogpond/timer', () => ({
	useMomentTimer: () => ({now: new Date()}),
}))

jest.mock('@react-navigation/elements', () => {
	const React = require('react')
	const {View} = require('react-native')
	return {
		PlatformPressable: ({
			children,
			...props
		}: {
			children: React.ReactNode
			[key: string]: unknown
		}) =>
			React.createElement(
				View,
				{accessibilityLabel: props['aria-label']},
				children,
			),
	}
})

jest.mock('../../views/home/notice', () => {
	const React = require('react')
	const {View} = require('react-native')
	return {
		UnofficialAppNotice: () => React.createElement(View),
	}
})

jest.mock('../../views/building-hours/query', () => ({
	useGroupedBuildings: () => ({
		data: [
			{
				title: 'Academic',
				data: [
					{
						name: 'Rolvaag Memorial Library',
						category: 'Academic',
						schedule: [],
						image: null,
					},
				],
			},
		],
		error: null,
		refetch: jest.fn(),
		isLoading: false,
		isError: false,
		isRefetching: false,
	}),
}))

jest.mock('../../views/building-hours/row', () => {
	const React = require('react')
	const {TouchableOpacity, Text} = require('react-native')
	return {
		BuildingRow: ({
			info,
			onPress,
		}: {
			info: {name: string}
			now: unknown
			onPress: () => void
		}) =>
			React.createElement(
				TouchableOpacity,
				{testID: `building-row-${info.name}`, onPress},
				React.createElement(Text, null, info.name),
			),
	}
})

jest.mock('../../views/settings', () => {
	const React = require('react')
	const {View} = require('react-native')
	return {
		SettingsView: () => React.createElement(View, {testID: 'settings-view'}),
	}
})

jest.mock('../../views/contacts/list', () => {
	const React = require('react')
	const {View} = require('react-native')
	return {
		ContactsListView: () =>
			React.createElement(View, {testID: 'contacts-list'}),
	}
})

jest.mock('../../views/student-orgs/list', () => {
	const React = require('react')
	const {View} = require('react-native')
	return {
		StudentOrgsView: () =>
			React.createElement(View, {testID: 'student-orgs-list'}),
	}
})

jest.mock('@frogpond/ccc-calendar', () => {
	const React = require('react')
	const {View} = require('react-native')
	return {
		CccCalendarView: () => React.createElement(View, {testID: 'ccc-calendar'}),
		useNamedCalendar: () => ({}),
	}
})

beforeEach(() => {
	mockCapturedScreenOptions = []
})

// =============================================================================
// 6a: Home screen buttons navigate to correct screens
// =============================================================================
describe('Home screen buttons', () => {
	it('has all internal buttons with correct hrefs', () => {
		const HomePage = require('../index').default
		const {getByTestId} = render(<HomePage />)

		const expectedButtons = [
			'/menus',
			'/sis',
			'/building-hours',
			'/calendar',
			'/directory',
			'/streaming',
			'/news',
			'/contacts',
			'/transportation',
			'/dictionary',
			'/student-orgs',
			'/more',
			'/stoprint',
			'/sis/course-search',
		]

		for (const href of expectedButtons) {
			expect(getByTestId(`link-${href}`)).toBeTruthy()
		}
	})

	it('has external links for Campus Map and Oleville', () => {
		const HomePage = require('../index').default
		const {getByLabelText} = render(<HomePage />)

		// External links use HomeScreenLink (openUrl) rather than Link
		expect(getByLabelText('Campus Map')).toBeTruthy()
		expect(getByLabelText('Oleville')).toBeTruthy()
	})
})

// =============================================================================
// 6b: Screen titles are human-readable (not slugs)
// =============================================================================
describe('Screen titles', () => {
	it('Building Hours has title "Building Hours"', () => {
		mockCapturedScreenOptions = []
		const BuildingHoursView = require('../building-hours/index').default
		render(<BuildingHoursView />)
		expect(mockCapturedScreenOptions).toContainEqual(
			expect.objectContaining({title: 'Building Hours'}),
		)
	})

	it('Contacts has title "Important Contacts"', () => {
		mockCapturedScreenOptions = []
		const ContactsScreen = require('../contacts/index').default
		render(<ContactsScreen />)
		expect(mockCapturedScreenOptions).toContainEqual(
			expect.objectContaining({title: 'Important Contacts'}),
		)
	})

	it('Student Orgs has title "Student Orgs"', () => {
		mockCapturedScreenOptions = []
		const StudentOrgsScreen = require('../student-orgs/index').default
		render(<StudentOrgsScreen />)
		expect(mockCapturedScreenOptions).toContainEqual(
			expect.objectContaining({title: 'Student Orgs'}),
		)
	})

	it('Settings has title "Settings"', () => {
		mockCapturedScreenOptions = []
		const SettingsScreen = require('../settings/index').default
		render(<SettingsScreen />)
		expect(mockCapturedScreenOptions).toContainEqual(
			expect.objectContaining({title: 'Settings'}),
		)
	})

	describe('titles must not be route slugs', () => {
		const slugPattern = /^[a-z]+(-[a-z]+)+$/u

		it('Building Hours title is not a slug', () => {
			mockCapturedScreenOptions = []
			const BuildingHoursView = require('../building-hours/index').default
			render(<BuildingHoursView />)
			const title = mockCapturedScreenOptions.find((o) => o.title)?.title
			expect(title).toBeDefined()
			expect(title).not.toMatch(slugPattern)
			expect(title).toBe('Building Hours')
		})
	})
})

// =============================================================================
// 6c: Tab layouts render with correct tabs
// =============================================================================
describe('Tab layouts', () => {
	it('Menus has correct tabs and title', () => {
		mockCapturedScreenOptions = []
		const MenusTabLayout = require('../menus/_layout').default
		const {getByTestId} = render(<MenusTabLayout />)

		expect(mockCapturedScreenOptions).toContainEqual(
			expect.objectContaining({title: 'Menus'}),
		)
		expect(getByTestId('tab-trigger-index')).toBeTruthy()
		expect(getByTestId('tab-trigger-the-cage')).toBeTruthy()
		expect(getByTestId('tab-trigger-the-pause')).toBeTruthy()
		expect(getByTestId('tab-trigger-carleton')).toBeTruthy()
		expect(getByTestId('tab-label-Stav Hall')).toBeTruthy()
		expect(getByTestId('tab-label-The Cage')).toBeTruthy()
		expect(getByTestId('tab-label-The Pause')).toBeTruthy()
		expect(getByTestId('tab-label-Carleton')).toBeTruthy()
	})

	it('Streaming has correct tabs and title', () => {
		mockCapturedScreenOptions = []
		const StreamingTabLayout = require('../streaming/_layout').default
		const {getByTestId} = render(<StreamingTabLayout />)

		expect(mockCapturedScreenOptions).toContainEqual(
			expect.objectContaining({title: 'Streaming Media'}),
		)
		expect(getByTestId('tab-trigger-index')).toBeTruthy()
		expect(getByTestId('tab-trigger-webcams')).toBeTruthy()
		expect(getByTestId('tab-trigger-ksto')).toBeTruthy()
		expect(getByTestId('tab-trigger-krlx')).toBeTruthy()
		expect(getByTestId('tab-label-Streaming')).toBeTruthy()
		expect(getByTestId('tab-label-Webcams')).toBeTruthy()
		expect(getByTestId('tab-label-KSTO')).toBeTruthy()
		expect(getByTestId('tab-label-KRLX')).toBeTruthy()
	})

	it('News has correct tabs and title', () => {
		mockCapturedScreenOptions = []
		const NewsTabLayout = require('../news/_layout').default
		const {getByTestId} = render(<NewsTabLayout />)

		expect(mockCapturedScreenOptions).toContainEqual(
			expect.objectContaining({title: 'News'}),
		)
		expect(getByTestId('tab-trigger-index')).toBeTruthy()
		expect(getByTestId('tab-trigger-mess')).toBeTruthy()
		expect(getByTestId('tab-trigger-oleville')).toBeTruthy()
		expect(getByTestId('tab-label-St. Olaf')).toBeTruthy()
		expect(getByTestId('tab-label-The Mess')).toBeTruthy()
		expect(getByTestId('tab-label-Oleville')).toBeTruthy()
	})

	it('SIS has correct tabs and title', () => {
		mockCapturedScreenOptions = []
		const SisTabLayout = require('../sis/_layout').default
		const {getByTestId} = render(<SisTabLayout />)

		expect(mockCapturedScreenOptions).toContainEqual(
			expect.objectContaining({title: 'SIS'}),
		)
		expect(getByTestId('tab-trigger-index')).toBeTruthy()
		expect(getByTestId('tab-trigger-student-work')).toBeTruthy()
		expect(getByTestId('tab-label-Balances')).toBeTruthy()
		expect(getByTestId('tab-label-Open Jobs')).toBeTruthy()
	})

	it('Transportation has correct tabs and title', () => {
		mockCapturedScreenOptions = []
		const TransportationTabLayout = require('../transportation/_layout').default
		const {getByTestId} = render(<TransportationTabLayout />)

		expect(mockCapturedScreenOptions).toContainEqual(
			expect.objectContaining({title: 'Transportation'}),
		)
		expect(getByTestId('tab-trigger-index')).toBeTruthy()
		expect(getByTestId('tab-trigger-red-line')).toBeTruthy()
		expect(getByTestId('tab-trigger-blue-line')).toBeTruthy()
		expect(getByTestId('tab-trigger-oles-go')).toBeTruthy()
		expect(getByTestId('tab-trigger-other-modes')).toBeTruthy()
		expect(getByTestId('tab-label-Express Bus')).toBeTruthy()
		expect(getByTestId('tab-label-Red Line')).toBeTruthy()
		expect(getByTestId('tab-label-Blue Line')).toBeTruthy()
		expect(getByTestId('tab-label-Oles Go')).toBeTruthy()
		expect(getByTestId('tab-label-Other Modes')).toBeTruthy()
	})

	it('Calendar has correct tabs and title', () => {
		mockCapturedScreenOptions = []
		const CalendarTabLayout = require('../calendar/_layout').default
		const {getByTestId} = render(<CalendarTabLayout />)

		expect(mockCapturedScreenOptions).toContainEqual(
			expect.objectContaining({title: 'Calendar'}),
		)
		expect(getByTestId('tab-trigger-index')).toBeTruthy()
		expect(getByTestId('tab-trigger-oleville')).toBeTruthy()
		expect(getByTestId('tab-trigger-northfield')).toBeTruthy()
		expect(getByTestId('tab-label-St. Olaf')).toBeTruthy()
		expect(getByTestId('tab-label-Oleville')).toBeTruthy()
		expect(getByTestId('tab-label-Northfield')).toBeTruthy()
	})
})

// =============================================================================
// 6d: List -> detail navigation
// =============================================================================
describe('Building Hours list to detail navigation', () => {
	it('calls router.push with correct params when a building is pressed', () => {
		mockRouterPush.mockClear()

		const BuildingHoursView = require('../building-hours/index').default
		const {getByTestId} = render(<BuildingHoursView />)

		const row = getByTestId('building-row-Rolvaag Memorial Library')
		fireEvent.press(row)

		expect(mockRouterPush).toHaveBeenCalledWith({
			pathname: '/building-hours/location/[location]',
			params: {location: 'Rolvaag Memorial Library'},
		})
	})
})
