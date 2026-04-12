import * as SecureStore from 'expo-secure-store'

export type StoredCredentials = {
	username: string
	password: string
}

function credentialsKey(service: string): string {
	return `credentials:${service}`
}

export async function getInternetCredentials(
	service: string,
): Promise<StoredCredentials | null> {
	const raw = await SecureStore.getItemAsync(credentialsKey(service))
	if (!raw) {
		return null
	}
	return JSON.parse(raw) as StoredCredentials
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
