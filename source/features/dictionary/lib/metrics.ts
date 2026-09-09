/// Measured off a screenshot of the iOS dictionary sheet, in points: the
/// system sets its entries with a wide margin, a headword a little larger than
/// `title`, and senses stepped in again from the headword.
export const BODY_LINE_SPACING = 0
export const HEADWORD_SIZE = 24
export const PRONUNCIATION_SIZE = 19
/// The part of speech is set smaller than the entry's own text.
export const PART_OF_SPEECH_SIZE = 15
/// The sheet pads to the route's own title and toolbar, so the entry's text
/// steps in by the same margin.
export const SHEET_PADDING = 23
/// The gap above the headword, below whatever chrome the route above draws.
export const SHEET_TOP_PADDING = 13
export const TEXT_INDENT = 10
/// Senses step in again, with the number hung in the gutter so wrapped lines
/// align under the first rather than under the number.
export const SENSE_INDENT = 26
export const SENSE_NUMBER_WIDTH = 15
/// A dictionary divides several citations for one sense with a vertical bar.
export const EXAMPLE_SEPARATOR = ' | '
export const SUBSENSE_MARKER = '•'
/// The entry starts well below the sheet's own top edge.
export const HEADING_TOP_SPACE = 30
/// The headword, its phonetics and its part of speech read as one block, so
/// they sit closer together than the gaps between blocks.
export const HEADING_SPACING = 13
