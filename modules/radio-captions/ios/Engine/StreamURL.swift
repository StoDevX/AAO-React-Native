import Foundation

enum StreamURL {
	/// The stream address as a URL, if it is an http(s) address with a host. `URL(string:)`
	/// alone accepts nearly any text, which would only fail later inside the decoder.
	static func parse(_ address: String) -> URL? {
		guard let url = URL(string: address),
			let scheme = url.scheme?.lowercased(), scheme == "http" || scheme == "https",
			let host = url.host(), !host.isEmpty
		else { return nil }
		return url
	}
}
