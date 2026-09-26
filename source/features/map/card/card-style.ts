import {font, listRowBackground, listRowInsets, listRowSeparator} from '@expo/ui/swift-ui/modifiers'

// Apple Maps' place card, measured on an iPhone 17 Pro simulator running
// iOS 27: content keeps 16pt from each side, a Details row is 50pt with 15pt
// above and below its text, and a heading's text sits 30pt under the previous
// section's last row.

/// Space between the card's content and each side of the sheet.
export const CARD_INSET = 16

/// Space above and below the text of a Details-style row.
export const ROW_PADDING = 15

/// Space between the end of one section and the top of the next heading's text.
export const SECTION_GAP = 30

/// Maps sets its section headings in bold `title3`.
export const HEADING_TEXT = [font({textStyle: 'title3', weight: 'bold'})]

/// A section heading's row: on the sheet, scrolling with the card rather than
/// pinned as a list's section header would be.
export const HEADING_ROW = [
	listRowBackground('clear'),
	listRowSeparator('hidden'),
	listRowInsets({top: SECTION_GAP, leading: CARD_INSET, bottom: 0, trailing: CARD_INSET}),
]

/// A Details-style row: on the sheet, with a hairline under it.
export const DETAIL_ROW = [
	listRowBackground('clear'),
	listRowInsets({
		top: ROW_PADDING,
		leading: CARD_INSET,
		bottom: ROW_PADDING,
		trailing: CARD_INSET,
	}),
]

/// The last row of a section has no hairline under it, as in Maps.
export const LAST_ROW = [...DETAIL_ROW, listRowSeparator('hidden', 'bottom')]
