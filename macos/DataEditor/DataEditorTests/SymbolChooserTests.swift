import Testing
@testable import DataEditor

@MainActor
struct SymbolChooserTests {
    /// Every symbol the chooser offers is one the system draws.
    @Test func offersOnlySymbols() {
        #expect(SymbolChooser.curated.filter { !SymbolChooser.isSymbol($0) } == [])
    }

    @Test func offersASymbolTheListLacksByItsWholeName() {
        #expect(SymbolChooser.offered("tortoise.fill") == ["tortoise.fill"])
        #expect(SymbolChooser.offered("cup") == SymbolChooser.matching("cup"))
        #expect(SymbolChooser.offered("not.a.symbol") == [])
    }

    @Test func findsSymbolsByAnyPartOfTheirName() {
        #expect(SymbolChooser.matching("cup").contains("cup.and.saucer"))
        #expect(SymbolChooser.matching("").count == SymbolChooser.curated.count)
    }
}
