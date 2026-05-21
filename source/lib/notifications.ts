import * as Notifications from 'expo-notifications'
import {getItem, setItem} from '@frogpond/storage'

// ─── Background task name ────────────────────────────────────────────────────

export const BACKGROUND_NOTIFICATIONS_TASK =
	'com.drewvolz.stolaf.background-notifications'

// ─── Permission helpers ───────────────────────────────────────────────────────

/**
 * Returns true if the user has granted notification permissions
 * (including provisional authorization on iOS).
 */
export async function hasNotificationPermission(): Promise<boolean> {
	const settings = await Notifications.getPermissionsAsync()
	return (
		settings.granted ||
		settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
	)
}

/**
 * Prompts the user for notification permissions.
 * Returns true if the user granted (or had already granted) permission.
 */
export async function requestNotificationPermission(): Promise<boolean> {
	const settings = await Notifications.requestPermissionsAsync({
		ios: {
			allowAlert: true,
			allowBadge: true,
			allowSound: true,
		},
	})
	return (
		settings.granted ||
		settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
	)
}

// ─── Notification scheduling ─────────────────────────────────────────────────

export interface LocalNotificationOptions {
	/** Short title displayed in bold at the top of the notification. */
	title: string
	/** Body text shown below the title. */
	body: string
	/**
	 * Optional identifier; if supplied any previously scheduled notification
	 * with the same identifier is replaced before scheduling the new one.
	 * Use this to avoid duplicate notifications for the same feature.
	 */
	identifier?: string
	/** Any extra data you want attached to the notification payload. */
	data?: Record<string, unknown>
}

/**
 * Immediately delivers a local notification, replacing any previously
 * scheduled notification that shares the same `identifier`.
 */
export async function scheduleLocalNotification(
	options: LocalNotificationOptions,
): Promise<string> {
	const {title, body, identifier, data} = options

	if (identifier) {
		await Notifications.cancelScheduledNotificationAsync(identifier).catch(
			() => undefined,
		)
	}

	return Notifications.scheduleNotificationAsync({
		identifier,
		content: {title, body, data: data ?? {}},
		trigger: null, // deliver immediately
	})
}

// ─── Content hash / diff helpers ─────────────────────────────────────────────

/**
 * Produces a stable JSON string for any serialisable value so we can hash it.
 * Object keys are sorted to ensure the same object always produces the same
 * string regardless of insertion order.
 */
function stableStringify(value: unknown): string {
	if (value === null || typeof value !== 'object') {
		return JSON.stringify(value)
	}
	if (Array.isArray(value)) {
		return '[' + value.map(stableStringify).join(',') + ']'
	}
	const sorted = Object.keys(value)
		.sort()
		.map((k) => {
			return (
				JSON.stringify(k) +
				':' +
				stableStringify((value as Record<string, unknown>)[k])
			)
		})
	return '{' + sorted.join(',') + '}'
}

/**
 * Returns a simple (non-cryptographic) hash string for the given value.
 * Good enough for "did this JSON blob change?" comparisons.
 */
export function hashContent(value: unknown): string {
	const str = stableStringify(value)
	let h = 0
	for (let i = 0; i < str.length; i++) {
		h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
	}
	// Return as unsigned hex so it's always positive and human-readable
	return (h >>> 0).toString(16)
}

// ─── Persisted-hash storage ───────────────────────────────────────────────────

const HASH_KEY_PREFIX = 'notifications:hash'

/** Returns the storage key for a given feature's content hash. */
function hashStorageKey(featureId: string): string {
	return `${HASH_KEY_PREFIX}:${featureId}`
}

/** Reads the previously stored content hash for a feature, or null. */
export function getStoredHash(featureId: string): Promise<string | null> {
	return getItem<string>(hashStorageKey(featureId))
}

/** Writes the current content hash for a feature. */
export function setStoredHash(featureId: string, hash: string): Promise<void> {
	return setItem(hashStorageKey(featureId), hash)
}

/**
 * Compares the hash of `freshData` against the stored hash for `featureId`.
 *
 * - If the content has changed (or there is no stored hash), calls `onChanged`
 *   with the new hash and returns `true`.
 * - If the content is unchanged, returns `false` without calling `onChanged`.
 *
 * The caller is responsible for persisting the new hash (via `setStoredHash`)
 * after successfully delivering the notification, so a failed notification
 * delivery is retried on the next background wake.
 */
export async function hasContentChanged(
	featureId: string,
	freshData: unknown,
): Promise<{changed: boolean; newHash: string}> {
	const newHash = hashContent(freshData)
	const oldHash = await getStoredHash(featureId)
	return {changed: oldHash !== newHash, newHash}
}
