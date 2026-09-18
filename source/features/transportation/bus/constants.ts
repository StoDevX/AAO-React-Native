const BUS_FOOTER_HEADLINE = 'Bus routes and times subject to change without notice'
const BUS_FOOTER_SUBHEADLINE = 'Data collected by the humans of All About Olaf'

export const BUS_FOOTER_MESSAGE = [BUS_FOOTER_HEADLINE, BUS_FOOTER_SUBHEADLINE].join('\n\n')

/**
 * The horizontal margin an inset-grouped section leaves at each side.
 *
 * The hosted timetable needs an explicit width: `matchContents` lays hosted
 * content out against an unbounded constraint, so a subtree sized by `flex`
 * ends up with frames thousands of points wide -- drawn correctly by SwiftUI,
 * but untappable and unreadable to the UI tests. Taking the width from the
 * viewport rather than from the host keeps the measurement from being
 * circular.
 */
export const SECTION_HORIZONTAL_INSET = 20
