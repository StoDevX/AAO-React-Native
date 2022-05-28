import * as React from 'react'
import {Cell, Section} from '@frogpond/tableview'
import {appVersion, appBuild} from '@frogpond/constants'

export const OddsAndEndsSection = (): JSX.Element => {
	let version = appVersion()
	let build = appBuild()

	return (
		<Section header="ODDS &amp; ENDS">
			<Cell cellStyle="RightDetail" detail={version} title="Version" />
			{Boolean(build) && (
				<Cell cellStyle="RightDetail" detail={build} title="Build Number" />
			)}
		</Section>
	)
}
