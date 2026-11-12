import FoundationModels
import Testing
@testable import DataEditorKit

struct SuggestionOfferTests {
    @Test func offersASuggestionWhenTheModelIsAvailable() {
        #expect(SuggestionOffer(.available) == .offered)
    }

    /// Nothing the contributor can do makes this Mac run the model, so the button would only tease.
    @Test func hidesTheButtonOnAMacThatCannotRunTheModel() {
        #expect(SuggestionOffer(.unavailable(.deviceNotEligible)) == .hidden)
    }

    /// The contributor can fix these, so the button stays in sight with what stands in its way.
    @Test func saysWhatStandsInTheWayWhenTheContributorCanFixIt() {
        #expect(SuggestionOffer(.unavailable(.appleIntelligenceNotEnabled))
            == .waiting("Turn on Apple Intelligence in System Settings to get a suggestion."))
        #expect(SuggestionOffer(.unavailable(.modelNotReady)) == .waiting("The on-device model is still downloading."))
    }
}
