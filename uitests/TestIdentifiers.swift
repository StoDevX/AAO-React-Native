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
		/// Matches the report screen's own explicit back button, whose
		/// accessibilityLabel is fixed rather than the previous screen's title,
		/// so tests can assert on it regardless of which building is open.
		static let backButton = "Back"
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
		static let athletics = "Athletics"
		static let calendar = "Calendar"
		static let sis = "SIS"
		static let campus = "Campus"
		static let dictionary = "Dictionary"
		static let carletonCampus = "Carleton Campus"
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
		static let actionsMenu = "More actions"
		static let suggestAnEdit = "Suggest an Edit"
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

		static let editForm = "dictionary-edit-form"
		static let previewSheet = "dictionary-preview-sheet"
		static let preview = "Preview"
		static let reorder = "Reorder"
		static let addSense = "Add Sense"
		/// Each sense's definition field carries its position in the form, so
		/// which field holds which text is exactly what a reorder changes --
		/// and the only place on screen a drag's result can be read.
		static func definitionField(_ position: Int) -> String { "Definition \(position)" }
		static let firstDefinitionField = definitionField(1)
		/// The field `addSense()` produces -- always empty when it first
		/// appears, unlike `firstDefinitionField`, which the reference entry
		/// seeds with real text.
		static let secondDefinitionField = definitionField(2)
		/// The reference entry's own first definition, so a reorder test can
		/// say where that sense ended up. Matches `REFERENCE_ENTRY` in
		/// `source/features/dictionary/lib/reference-entry.ts`.
		static let referenceEntryFirstDefinition =
			"make (someone or something) different; alter or modify"
		/// The marker `@expo/ui` splices into a sentence under DEBUG when a
		/// modifier is not in its nested-`Text` whitelist. Our patch adds
		/// strikethrough and underline to that list; if a version bump ever drops
		/// the patch, this string appears in the preview instead of the markup.
		static let unsupportedNestedModifier = "not supported for nested Text"
	}

	// MARK: - Carleton Map
	//
	// `/Map` now serves both campuses; this enum keeps its original name since
	// it is the shared map screen's own identifiers, not Carleton-specific ones.

	enum CarletonMap {
		/// The sheet's search field. The bar's testID is its placeholder, and
		/// UIKit puts the identifier on the text field, so this is a
		/// `searchFields` query.
		static let search = "Search for a place"
		/// The map view itself. MapLibre publishes one element for the whole map --
		/// labelled "Map", valued with the zoom -- and nothing per building, so
		/// this is the only handle a test has on where the map is on screen.
		static let map = "Map"
		/// UIKit's own dismiss button on the search bar, found by label. iOS 26
		/// draws it as a circular glyph beside the field and labels it "Close".
		static let cancel = "Close"
		/// The building card's own dismiss button, a `testID` rather than a
		/// label -- it shares the "Close" label with the search bar's Cancel
		/// (`cancel`, above), and the picker is still mounted while the card's
		/// query runs, so a label-only query could answer for either. Matches
		/// `CARD_CLOSE_BUTTON_ID` in `source/features/map/building-info.tsx`.
		static let cardCloseButton = "card-close-button"
		/// MapLibre's attribution button, found by the label it gives itself. It
		/// carries the OpenStreetMap credit, so it has to stay reachable.
		static let attribution = "About this map"
		/// UIKit's own drag indicator on the presented sheet, found by label --
		/// it carries no identifier. Its element is the sheet's child, which is
		/// how the sheet's own box is found.
		static let sheetGrabber = "Sheet Grabber"
		/// A building near the top of the alphabetical list, so the expanded
		/// sheet shows it without scrolling.
		static let aBuilding = "Allen House"
		/// A St. Olaf-only building, also near the top of the alphabetical list
		/// -- absent from Carleton's map data, so selecting it is what would
		/// fail if the map's campus parameter were ignored.
		static let aStolafBuilding = "Buntrock Commons"
		/// A second building, high enough in the list to be on screen even with
		/// the keyboard up, and not a match for `aBuilding` under the picker's
		/// subsequence search -- so typing that query has to drop it. Carleton can
		/// rename either of these; a failure here is worth checking against the
		/// list before it is blamed on the filter.
		static let anotherBuilding = "216 College Street"
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
		/// Categories the picker offers, written as the menu draws them: the
		/// name, then how many events carry it. The counts come from
		/// `modules/ccc-calendar/fixtures/uitest-events.json` read at the app's
		/// frozen clock, so they hold for as long as that fixture does.
		static let categories = ["Music (10)", "Academic Year (6)"]
		/// The picker menu's one section header. SwiftUI draws a Menu section
		/// title as static text, uppercased by the caller rather than by the
		/// platform.
		static let calendarsSection = "CALENDARS"
		/// The rows that open each axis's submenu. A row names its selection
		/// after a colon once that axis is filtered, so a test matching one has
		/// to match on the prefix.
		static let categoryMenu = "Category"
		static let organizationMenu = "Organization"
		/// Clears whichever axis is filtered, from the bottom of the picker.
		/// Present only while something is filtered, and it dismisses the menu.
		static let resetFilters = "Reset Filters"
		/// A sponsoring organisation named by the fixture calendar's events,
		/// written as the menu draws it. It sponsors three of them, so filtering
		/// to it leaves the list narrowed rather than empty.
		///
		/// The fixture names two organisations, and short ones. iOS scrolls a
		/// menu taller than the screen, and a section header scrolled out of the
		/// viewport is absent from the accessibility hierarchy rather than
		/// merely offscreen -- so `verifyMenuSection` fails on a menu that is
		/// only too long. A name long enough to wrap its row costs half again
		/// the height of one that does not.
		static let organization = "Music Organizations (3)"
		/// The one calendar UI test mode enables, from `REMOTE_SOURCES`.
		static let uitestCalendar = "UI Test Fixtures"
		/// Every attribution caption opens with this. The list should carry
		/// none and the event detail exactly one.
		static let attributionPrefix = "Powered by"
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

		/// Day view's empty-state copy, shown below the strip when the selected
		/// day has no events. Mirrors the literal in `modules/event-list/day-view.tsx`.
		static let emptyDayNotice = "Nothing on this day."

		/// Day view's empty-state copy when every calendar is switched off.
		/// Mirrors the literal in `modules/event-list/day-view.tsx`.
		static let noCalendarsNotice =
			"No calendars are showing. Choose some from the Calendars button below."

		/// The top-right menu that chooses how the calendar draws itself.
		/// Mirrors `accessibilityLabel('Calendar view')` in
		/// `modules/ccc-calendar/mode-picker.tsx`.
		static let modePicker = "Calendar view"
		static let dayMode = "Day"
		static let upcomingMode = "Upcoming"
		/// The mode that is committed commented out, and so must not appear.
		static let timelineMode = "Timeline"

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

		/// The one entry a UI-test run's directory holds, carrying every field
		/// the detail screen draws. Mirrors `UITEST_ENTRY_NAME` in
		/// `source/features/directory/__fixtures__/entries.ts`.
		static let fixtureEntry = "Kari Testerson"
		static let fixtureEntryDepartment = "Computer Science"
	}

	// MARK: - Campus

	enum Campus {
		/// A St. Olaf venue. Under test the app reads St. Olaf's hours from this
		/// repository's bundled copy rather than a server, so this is whatever
		/// `data/building-hours/` says today.
		static let aBuilding = "Rølvaag Library"
		/// A query that matches `aBuilding` only through deburring, so the test
		/// fails if the filter stops stripping diacritics.
		static let deburredQuery = "rolvaag"
		/// A building that must fall out of the list when `deburredQuery` is
		/// typed, so the test proves narrowing rather than mere survival. Also
		/// the name shown as the detail sheet's own title once tapped. Its
		/// schedule is a single short section that already fits the sheet's
		/// smaller detent -- see `aBuildingWithLongSchedule` for the one that
		/// overflows it.
		static let anExcludedBuilding = "The Cage"
		/// Another Food-category building, in the same unscrolled viewport as
		/// `anExcludedBuilding` -- so a tap aimed at it while a sheet is up lands
		/// on the dimmed list behind the sheet rather than on content the sheet
		/// itself covers. Its schedule sections are titled Breakfast/Lunch/Dinner,
		/// never "Hours", which is what makes its detail content an unambiguous
		/// tell for a second sheet: nothing else on this screen shows those words.
		static let aSecondBuilding = "Stav Hall"
		/// A building with two schedule sections and a resource link -- enough
		/// combined content to overflow the sheet's smaller detent, unlike
		/// `anExcludedBuilding`'s single short section. One of its sections is
		/// still titled "Hours", so `tapRow`'s own detection of a successful tap
		/// still applies.
		static let aBuildingWithLongSchedule = "The Pause Kitchen"
		/// A query no building matches, so the screen must say no results were
		/// found rather than claim the data is missing -- the two states read
		/// differently, or a broken search looks like a server outage.
		static let unmatchedQuery = "zzznomatch"
		/// Mirrors BUILDING_ROW_PREFIX in
		/// source/features/building-hours/list/building-list-row.tsx.
		static let rowPrefix = "building-row-"
		/// A schedule section heading on the detail sheet, shown only once a
		/// building is open in the sheet.
		static let detailSchedule = "HOURS"
		/// The detail sheet's overflow menu button, labelled "More" -- the same
		/// string as `Buttons.more`, the Home screen's own tile, purely by
		/// coincidence of wording rather than a shared identifier. The two
		/// screens are never on screen together, so today's bare-label match in
		/// `openDetailMenu` cannot collide with the tile, but reusing the
		/// constant keeps that coincidence from drifting into two truths.
		static let detailMenu = Buttons.more
		/// The one action the detail sheet's overflow menu offers.
		static let reportAction = "Report a Problem"
		/// The report screen's own `InfoHeader` title -- distinct from
		/// `reportAction`, which labels the menu button that opens it, so a test
		/// can tell the screen actually came up rather than the menu item merely
		/// existing.
		static let reportScreenPrompt = "Thanks for spotting a problem!"
		/// The report screen's own submit control, in the navigation bar.
		static let submitReportAction = "Submit Report"

		/// A Carleton-only venue: present in Carleton's live `spaces/hours` but
		/// absent from St. Olaf's, so a test tapping into the Carleton tile fails
		/// if the campus parameter is ignored and St. Olaf's list loads instead.
		static let carletonBuilding = "Sayles Café"

		/// Both campuses' Campus screens carry this top-right toolbar button,
		/// which pushes to `/Map` for whichever campus is showing -- the
		/// hand-hosted map screen stays where it is, so this is a navigation,
		/// not a mode switch.
		static let mapButton = "Map"

		/// A St. Olaf venue whose `building` key (`toh`) resolves to a
		/// differently-named feature -- Tomson Hall, not Registrar -- so a test
		/// asserting the cutout frames `aBuildingWithCutoutFrames` only passes if
		/// the join actually used the key. `The Cage`, whose key (`thecage`)
		/// happens to share wording with its own name, would pass even with a
		/// broken join that fell back to matching on name.
		static let aBuildingWithCutout = "Registrar"
		static let aBuildingWithCutoutFrames = "Tomson Hall"

		/// The prefix `BuildingCutout` sets as its accessibility label, naming
		/// the building it frames. Mirrors the template literal in
		/// source/features/building-hours/detail/building-cutout.tsx.
		static let cutoutLabelPrefix = "Map showing "
	}

	// MARK: - Course Catalog

	enum CourseCatalog {
		static let recent = "Recent"
		/// The one course a UI-test run's catalogue holds. Mirrors
		/// `UITEST_COURSE_NAME` in
		/// `source/lib/course-search/__fixtures__/courses.ts`.
		static let aCourse = "Hybrid Test Course"
	}

	// MARK: - StoPrint

	enum StoPrint {
		static let notLoggedIn = "You are not logged in"
	}

	// MARK: - Transportation

	enum Transportation {
		static let tabs = ["Express", "Red Line", "Blue Line", "Oles Go", "Other"]
		/// The list footer renders as a single Text, so both lines are one label.
		/// A stop every Express Bus route passes through, used to open a single
		/// stop's schedule. It is the college itself, so it is not going to be
		/// renamed out from under this test.
		static let aStop = "St. Olaf College"
		static let footer = """
			Bus routes and times subject to change without notice

			Data collected by the humans of All About Olaf
			"""
	}
}
