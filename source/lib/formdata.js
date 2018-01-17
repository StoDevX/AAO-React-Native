// @flow

export default function buildFormData(obj: {[key: string]: string}): FormData {
	let formData = new FormData()
	for (const key in obj) {
		if (obj.hasOwnProperty(key)) {
			formData.append(key, obj[key])
		}
	}
	return formData
}
