import AppKit
import Testing
@testable import DataEditor

@MainActor
struct RepeatClickTests {
    private func mouse(_ type: NSEvent.EventType, clicks: Int) -> NSEvent? {
        NSEvent.mouseEvent(with: type, location: .zero, modifierFlags: [], timestamp: 0, windowNumber: 0,
                           context: nil, eventNumber: 0, clickCount: clicks, pressure: 1)
    }

    @Test func theSecondClickOfADoubleClickIsARepeat() {
        #expect(isRepeatClick(mouse(.leftMouseUp, clicks: 2)))
        #expect(isRepeatClick(mouse(.leftMouseDown, clicks: 2)))
    }

    @Test func aSingleClickIsNot() {
        #expect(!isRepeatClick(mouse(.leftMouseUp, clicks: 1)))
    }

    @Test func aKeyPressIsNot() {
        let space = NSEvent.keyEvent(with: .keyDown, location: .zero, modifierFlags: [], timestamp: 0, windowNumber: 0,
                                     context: nil, characters: " ", charactersIgnoringModifiers: " ", isARepeat: false, keyCode: 49)
        #expect(!isRepeatClick(space))
    }

    @Test func noEventIsNot() {
        #expect(!isRepeatClick(nil))
    }
}
