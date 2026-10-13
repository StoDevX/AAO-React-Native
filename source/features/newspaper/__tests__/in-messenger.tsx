import * as React from 'react'

import {MESSENGER} from '../../../campuses/edu-stolaf/paper'
import {PaperProvider} from '../paper-context'

export {MESSENGER}

/** `children` as screens of the Messenger, as its route files show them. */
export function InMessenger({children}: {children: React.ReactNode}): React.ReactNode {
	return (
		<PaperProvider campus="edu.stolaf" paper={MESSENGER}>
			{children}
		</PaperProvider>
	)
}
