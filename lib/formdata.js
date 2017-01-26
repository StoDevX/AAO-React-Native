// @flow

export default function buildFormData(obj: {[key: string]: string}): FormData {
  let formData = new FormData()
  for (let [key, val] of Object.entries(obj)) {
    formData.append(key, val)
  }
  return formData
}
