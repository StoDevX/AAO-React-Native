// @flow

export function parseLinks(data: string) {
  const allLinks = data.split(' ')
  if (!allLinks.length) {
    return []
  }
  return allLinks.filter(w => /^https?:\/\//.test(w))
}
