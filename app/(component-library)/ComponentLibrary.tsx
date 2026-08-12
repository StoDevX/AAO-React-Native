import * as React from 'react'

import {ComponentLibrary} from '../../source/views/settings/screens/overview/component-library'

// This file is named ComponentLibrary.tsx (not index.tsx) so it doesn't
// claim the bare `/` route -- (component-library) is a top-level group,
// a sibling of (home), so an index.tsx here would collide with
// app/(home)/index.tsx for the unqualified `/` path. This screen is
// reachable at /ComponentLibrary. PR 8's developer.tsx entry point must
// push to '/ComponentLibrary', not '/(component-library)' or '/'.
export default function ComponentLibraryRootPage(): React.ReactNode {
	return <ComponentLibrary />
}
