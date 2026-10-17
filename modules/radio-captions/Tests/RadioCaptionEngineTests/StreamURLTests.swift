import Testing
@testable import RadioCaptionEngine

struct StreamURLTests {
	@Test(arguments: ["https://example.com/stream", "http://s3.voscast.com:8000/krlx"])
	func acceptsAnHTTPAddressWithAHost(address: String) {
		#expect(StreamURL.parse(address)?.absoluteString == address)
	}

	@Test(arguments: [
		"", "krlx", "ftp://example.com/stream", "file:///tmp/a.mp3", "https://", "http:///path",
		"example.com/stream",
	])
	func rejectsAnythingElse(address: String) {
		#expect(StreamURL.parse(address) == nil)
	}
}
