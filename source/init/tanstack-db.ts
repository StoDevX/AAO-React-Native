import {open} from '@op-engineering/op-sqlite'
import * as Sentry from '@sentry/react-native'
import {
	type OpSQLiteDatabaseLike,
	createReactNativeSQLitePersistence,
} from '@tanstack/react-native-db-sqlite-persistence'

let persistence: ReturnType<typeof createReactNativeSQLitePersistence> | null =
	null

try {
	// op-sqlite's DB type is structurally incompatible with OpSQLiteDatabaseLike despite
	// providing compatible methods at runtime. The persistence library detects execute methods
	// duck-typed, so this cast is safe.
	const database = open({name: 'aao.db'}) as unknown as OpSQLiteDatabaseLike
	persistence = createReactNativeSQLitePersistence({database})
} catch (e) {
	Sentry.captureException(e)
	if (__DEV__) {
		console.warn(
			'[tanstack-db] SQLite init failed — collections will run without persistence:',
			e,
		)
	}
}

export {persistence}
