import * as SecureStore from 'expo-secure-store'

export type StoredCredentials = {
	username: string
	password: string
}

function credentialsKey(service: string): string {
	return `credentials_${service}`
}

export async function getInternetCredentials(
	service: string,
): Promise<StoredCredentials | null> {
	const raw = await SecureStore.getItemAsync(credentialsKey(service))
	if (!raw) {
		return null
	}
	const parsed = JSON.parse(raw) as unknown
	if (
		typeof parsed === 'object' &&
		parsed !== null &&
		'username' in parsed &&
		'password' in parsed &&
		typeof (parsed as StoredCredentials).username === 'string' &&
		typeof (parsed as StoredCredentials).password === 'string'
	) {
		return parsed as StoredCredentials
	}
	return null
}

export async function setInternetCredentials(
	service: string,
	username: string,
	password: string,
): Promise<boolean> {
	try {
		await SecureStore.setItemAsync(
			credentialsKey(service),
			JSON.stringify({username, password}),
		)
		return true
	} catch {
		return false
	}
}

export async function resetInternetCredentials(service: string): Promise<void> {
	await SecureStore.deleteItemAsync(credentialsKey(service))
}
