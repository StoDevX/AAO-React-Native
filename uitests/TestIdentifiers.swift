import Foundation

/// Shared constants for accessibility identifiers, button labels, and launch
/// arguments used by both the app views and the UI test suite.
///
/// React Native `testID` props map to `accessibilityIdentifier` on iOS.
/// Keeping these strings in one place prevents drift between the app and tests.
struct TestIdentifiers {

	// MARK: - Launch Arguments

	enum LaunchArguments {
		static let uiTesting = "--uitesting"
		static let resetState = "--reset-state"
	}

	// MARK: - testID-based identifiers

	enum Home {
		static let screen = "screen-homescreen"
		static let notice = "home-notice"
	}

	enum Navigation {
		static let openSettings = "Open Settings"
		static let closeScreen = "Close Screen"
	}

	enum Streaming {
		static let list = "stream-list"
		static let webcams = "screen-streaming-webcams"
	}

	// MARK: - Home screen button labels

	enum Buttons {
		static let menus = "Menus"
		static let calendar = "Calendar"
		static let sis = "SIS"
		static let buildingHours = "Building Hours"
		static let campusDictionary = "Campus Dictionary"
		static let campusMap = "Campus Map"
		static let carletonMap = "Carleton Map (Beta)"
		static let courseCatalog = "Course Catalog"
		static let directory = "Directory"
		static let importantContacts = "Important Contacts"
		static let more = "More"
		static let stoPrint = "stoPrint"
		static let streamingMedia = "Streaming Media"
		static let studentOrgs = "Student Orgs"
		static let transportation = "Transportation"
	}

	// MARK: - Carleton Map

	enum CarletonMap {
		/// The sheet's search field. Its placeholder is its accessibility label,
		/// which is what a SwiftUI TextField reports when it has no other.
		static let search = "Search for a place"
		static let close = "Close"
		/// A building near the top of the alphabetical list, so the expanded
		/// sheet shows it without scrolling.
		static let aBuilding = "Allen House"
	}

	// MARK: - SIS

	enum SIS {
		static let iAgree = "I Agree"
		static let balancesHeader = "BALANCES"
		static let mealPlanHeader = "MEAL PLAN"
		static let backButton = "All About Olaf"
		static let openJobs = "Open Jobs"
	}

	// MARK: - Menus

	enum Menus {
		static let stOlafCafes = ["Stav Hall", "The Cage", "The Pause"]
		static let carleton = "Carleton"
		static let carletonCafes = ["Burton", "LDC", "Weitz Center", "Sayles Hill"]
	}

	// MARK: - Calendar

	enum Calendar {
		static let picker = "Calendars"
		static let calendars = ["St. Olaf", "Northfield"]
		/// Only the event detail screen carries this, so it is how a test knows
		/// the push landed.
		static let shareEvent = "Share Event"
		/// A calendar every simulator ships with, and one that actually has
		/// events in the window the list reads.
		static let deviceCalendar = "US Holidays"
	}

	// MARK: - Streaming Media

	enum StreamingMedia {
		static let tabs = ["Webcams", "KSTO", "KRLX"]
	}

	// MARK: - Settings

	enum Settings {
		static let signIn = "Sign in to St. Olaf"
		static let developer = "Developer"
		static let enableDevMode = "Enable dev mode"
	}

	// MARK: - Directory

	enum Directory {
		static let searchPrompt = "Search the Directory"
	}

	// MARK: - Course Catalog

	enum CourseCatalog {
		static let recent = "Recent"
	}

	// MARK: - StoPrint

	enum StoPrint {
		static let notLoggedIn = "You are not logged in"
	}

	// MARK: - Transportation

	enum Transportation {
		static let tabs = ["Express Bus", "Red Line", "Blue Line", "Oles Go", "Other Modes"]
	}
}
