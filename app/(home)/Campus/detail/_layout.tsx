import * as React from 'react'
import {Stack} from 'expo-router'

import {BuildingReportProvider} from '../../../../source/features/building-hours/report/context'

/**
 * The detail sheet's own navigation stack.
 *
 * A formSheet route needs a stack of its own for its screens to get a back
 * button — a flat sibling route pushed while the sheet is up renders inside it
 * with no way back out.
 *
 * The report screen and the schedule editor both edit one building, so the
 * draft they share is held here, above the two of them, and goes away with the
 * sheet.
 */
export default function CampusDetailLayout(): React.ReactNode {
	return (
		<BuildingReportProvider>
			<Stack />
		</BuildingReportProvider>
	)
}
