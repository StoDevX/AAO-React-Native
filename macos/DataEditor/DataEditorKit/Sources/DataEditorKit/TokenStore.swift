import Foundation
import Security

/// Where the GitHub token is kept between launches.
public protocol TokenStore: Sendable {
    func read() -> String?
    func write(_ token: String?)
}

/// The token in the login keychain, as a generic password.
public struct KeychainTokenStore: TokenStore {
    private let service = "com.drewvolz.allaboutolaf-data-editor.github"
    public init() {}

    private var query: [String: Any] { [kSecClass as String: kSecClassGenericPassword, kSecAttrService as String: service] }

    public func read() -> String? {
        var result: CFTypeRef?
        var query = self.query
        query[kSecReturnData as String] = true
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess, let data = result as? Data else { return nil }
        return String(decoding: data, as: UTF8.self)
    }

    public func write(_ token: String?) {
        SecItemDelete(query as CFDictionary)
        guard let token else { return }
        var item = query
        item[kSecValueData as String] = Data(token.utf8)
        SecItemAdd(item as CFDictionary, nil)
    }
}

/// A token held in memory, for tests.
public final class MemoryTokenStore: TokenStore, @unchecked Sendable {
    private let lock = NSLock()
    private var token: String?
    public init(_ token: String? = nil) { self.token = token }
    public func read() -> String? { lock.withLock { token } }
    public func write(_ token: String?) { lock.withLock { self.token = token } }
}
