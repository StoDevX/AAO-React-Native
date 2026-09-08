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
		/// The value half of `-UIPreferredContentSizeCategoryName`, UIKit's
		/// command-line override for the app's Dynamic Type size. This is AX5,
		/// the largest accessibility size, so a test launching with it proves a
		/// layout past the whole ordinary type ramp, not just one step into it.
		///
		/// UIKit's `UIContentSizeCategory` values are abbreviated, not spelled
		/// out -- "XXXL", not "ExtraExtraExtraLarge". The spelled-out form reads
		/// as a plausible constant name but names nothing UIKit recognises, and
		/// RCTAccessibilityManager fails to find a multiplier for it silently
		/// rather than refusing to launch.
		static let accessibilityExtraExtraExtraLarge = "UICTContentSizeCategoryAccessibilityXXXL"
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

	/// Labels UIKit gives a `Stack.SearchBar`'s own controls. In the bottom
	/// placement this app uses, the cancel button is the round one beside the
	/// field, and UIKit labels it "close" rather than "Cancel".
	enum Search {
		static let cancelButton = "close"
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
		static let dictionary = "Dictionary"
		static let campusMap = "Campus Map"
		static let carletonMap = "Carleton Map"
		static let courseCatalog = "Course Catalog"
		static let directory = "Directory"
		static let more = "More"
		static let news = "News"
		static let stoPrint = "stoPrint"
		static let streamingMedia = "Streaming Media"
		static let studentOrgs = "Student Orgs"
		static let transportation = "Transportation"
	}

	// MARK: - Dictionary

	enum Dictionary {
		static let list = "dictionary-list"
		static let definitionSheet = "dictionary-definition-sheet"
		static let editorSheet = "dictionary-editor-sheet"
		static let actionsMenu = "More actions"
		static let suggestAnEdit = "Suggest an Edit"
		static let close = "Close"
		static let wordField = "Word"
		/// The one entry carrying phonetics, and a Norwegian name whose
		/// diacritic an ASCII query has to get past to find it.
		static let phoneticEntry = "Rølvaag"
		static let phoneticEntryQuery = "Rolvaag"
		static let phoneticEntryIPA = "ˈrø̂ːlvoːɡ"
		static let phoneticEntryPartOfSpeech = "noun"
		/// A copy of the iOS dictionary's own "change" entry, present only under
		/// `--uitesting`, for comparing this sheet against a screenshot of
		/// Apple's.
		static let referenceEntry = "change"
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

		/// Matches FOOD_ROW_PREFIX in modules/food-menu/food-item-row.tsx.
		static let foodRowPrefix = "food-row-"

		/// The cafe whose menu comes from this repository's own
		/// `data/pause-menu.yaml`, so its stations and items are fixed rather
		/// than whatever Bon Appétit is serving today.
		static let pause = "The Pause"

		/// Two stations from that file, and one item from each. The Stations
		/// filter asks for a menu outright, so its shape does not depend on how
		/// many stations a cafe happens to serve.
		static let pizzaStation = "Pizza"
		static let specialtyPizzaStation = "Specialty Pizza"
		static let pizzaItem = "food-row-Single Slice"
		static let specialtyPizzaItem = "food-row-BBQ Chicken"

		/// A Bon Appétit cor-icon, and so both an option in Stav Hall's
		/// Dietary Restrictions filter and a word in the accessibility label
		/// of every food row that carries it.
		static let vegan = "Vegan"
		static let halal = "Halal"
	}

	// MARK: - Filters

	/// The toolbar `@frogpond/filter` draws, which Menus, Course Search,
	/// Streaming Media and News all share.
	enum Filter {
		/// Matches FILTER_TRIGGER_PREFIX in modules/filter/lib/trigger-modifiers.ts.
		static let triggerPrefix = "filter-trigger-"

		/// Matches FILTER_OPTION_PREFIX in modules/filter/filter-sheet.tsx.
		static let optionPrefix = "filter-option-"

		/// Matches FILTER_CLEAR_ID in modules/filter/filter-sheet.tsx.
		static let clear = "filter-clear"

		/// Matches FILTER_CLOSE_BUTTON_ID in modules/filter/filter-sheet.tsx.
		static let closeButton = "filter-close"

		/// A trigger is identified by its filter's key, from the `buildFilters`
		/// of whichever screen drew it.
		static func trigger(_ key: String) -> String {
			triggerPrefix + key
		}

		/// A sheet row is identified by its option's title.
		static func option(_ title: String) -> String {
			optionPrefix + title
		}

		/// Filter keys from modules/food-menu/lib/build-filters.ts.
		enum MenusKeys {
			static let specials = "specials"
			static let stations = "stations"
			static let dietaryRestrictions = "dietary-restrictions"
		}
	}

	// MARK: - Calendar

	enum Calendar {
		static let picker = "Calendar filter"
		/// Categories from the St. Olaf calendar. Unlike calendar sources, these
		/// come from the event data itself, so the exact set depends on what the
		/// calendar is serving. These two appear reliably.
		static let categories = ["Music", "Academic Year"]
		/// Only the event detail screen carries this, so it is how a test knows
		/// the push landed.
		static let shareEvent = "Share Event"
		/// The bottom-bar action on the event detail sheet. A bar item's
		/// identifier is its title, which is what XCUITest matches on.
		static let addToCalendar = "Add to Calendar"
		/// Dismisses the event detail sheet. A header bar item carrying only an
		/// SF Symbol, so its accessibility label is the only thing to find it by.
		static let closeEventDetail = "Close"
		/// Returns the list to the top. A bar item, so its title is its
		/// identifier.
		static let today = "Today"
		/// Each day-picker cell is identified by `day-cell-<ISO date>`.
		/// Mirrored by `DAY_CELL_PREFIX` in `modules/event-list/day-picker-strip.tsx`.
		static let dayCellPrefix = "day-cell-"

		/// Each event row is identified by `event-row-<title>`.
		/// Mirrored by `EVENT_ROW_PREFIX` in `modules/event-list/event-list-row.tsx`.
		static let eventRowPrefix = "event-row-"

		/// The instant the app freezes its clock to under `isUITesting`, so a
		/// test reasons about "today" the way the app does rather than off the
		/// live wall clock. Mirrors `UITEST_FROZEN_DATE` in
		/// `modules/timer/index.ts` (a Saturday).
		///
		/// Parsed from the same string the app parses rather than rebuilt from
		/// its parts: the constant carries a fixed offset, so rebuilding it as a
		/// wall time in campus's zone would agree only while that date sits in
		/// daylight time.
		static let frozenNow = ISO8601DateFormatter().date(from: "2026-09-05T12:00:00-05:00")!

		/// The identifier of the cell for a given day, formatted in the device's
		/// own zone. The calendar reads its clock and its events from the device,
		/// so a test naming days any other way is asserting against a zone the
		/// app does not use.
		static func dayCell(_ date: Date) -> String {
			let formatter = DateFormatter()
			formatter.calendar = Foundation.Calendar(identifier: .gregorian)
			formatter.locale = Locale(identifier: "en_US_POSIX")
			formatter.timeZone = TimeZone.current
			formatter.dateFormat = "yyyy-MM-dd"
			return dayCellPrefix + formatter.string(from: date)
		}
	}

	// MARK: - News

	enum News {
		/// Matches NEWS_ROW_PREFIX in source/features/news/news-row.tsx.
		static let rowPrefix = "news-row-"

		/// The bottom toolbar menu's accessibilityLabel, in news-picker.tsx.
		static let picker = "News filter"
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
		/// The heading above the contact tiles on the Directory screen.
		static let importantContacts = "Important Contacts"
		/// Matches CONTACT_GRID_ID in app/(home)/Directory/index.tsx.
		static let contactGrid = "directory-contact-grid"
		/// A contact from data/contact-info/, so its tile is in the grid
		/// whatever the server is serving.
		static let aContact = "PubSafe"
		/// That contact's own action, shown on its detail screen.
		static let aContactAction = "Call Public Safety"

		/// Search results in list mode: `directory-row-<index>`. Mirrors
		/// DIRECTORY_ROW_PREFIX in app/(home)/Directory/index.tsx.
		static let rowPrefix = "directory-row-"
		/// Search results in the tile gallery: `directory-tile-<index>`. Mirrors
		/// TILE_PREFIX in source/features/directory/directory-results-grid.tsx.
		static let tilePrefix = "directory-tile-"
		/// The bottom-toolbar button's accessibilityLabel in each direction.
		static let showAsList = "Show as list"
		static let showAsTiles = "Show as tiles"

		/// A directory entry with no title, email or profile, so its detail
		/// screen carries exactly one element labelled with its department --
		/// and it is a desk rather than a person, so the college is unlikely to
		/// rename it out from under this test.
		static let departmentalEntry = "Registrar Fax"
		static let department = "Registrar\u{2019}s Office"
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
		static let tabs = ["Express", "Red Line", "Blue Line", "Oles Go", "Other"]
	}
}
