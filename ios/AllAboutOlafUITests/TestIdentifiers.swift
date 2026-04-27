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
		static let openSettings = "button-open-settings"
		static let closeScreen = "button-close-screen"
	}

	enum Streaming {
		static let list = "stream-list"
		static let webcams = "screen-streaming-webcams"
	}

	enum AppIcon {
		static func cell(_ type: String, selected: Bool = false) -> String {
			"app-icon-cell-\(type)\(selected ? "-selected" : "")"
		}
	}

	// MARK: - Home screen button labels

	enum Buttons {
		static let menus = "Menus"
		static let calendar = "Calendar"
		static let sis = "SIS"
		static let buildingHours = "Building Hours"
		static let campusDictionary = "Campus Dictionary"
		static let campusMap = "Campus Map"
		static let courseCatalog = "Course Catalog"
		static let directory = "Directory"
		static let importantContacts = "Important Contacts"
		static let more = "More"
		static let oleville = "Oleville"
		static let stoPrint = "stoPrint"
		static let streamingMedia = "Streaming Media"
		static let studentOrgs = "Student Orgs"
		static let transportation = "Transportation"
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
		static let tabs = ["St. Olaf", "Oleville", "Northfield"]
	}

	// MARK: - Streaming Media

	enum StreamingMedia {
		static let tabs = ["Webcams", "KSTO", "KRLX"]
	}

	// MARK: - Settings

	enum Settings {
		static let signIn = "Sign in to St. Olaf"
		static let developer = "DEVELOPER"
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
