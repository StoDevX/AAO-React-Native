import {open} from '@op-engineering/op-sqlite'
import {
	createReactNativeSQLitePersistence,
	type OpSQLiteDatabaseLike,
} from '@tanstack/react-native-db-sqlite-persistence'

const database = open({name: 'aao.db'}) as unknown as OpSQLiteDatabaseLike

export const persistence = createReactNativeSQLitePersistence({database})
