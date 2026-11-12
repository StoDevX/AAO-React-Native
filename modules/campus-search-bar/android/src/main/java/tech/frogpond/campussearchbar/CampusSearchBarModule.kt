package tech.frogpond.campussearchbar

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CampusSearchBarModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("CampusSearchBar")

    View<CampusSearchBarProps>("CampusSearchBarView") {
      val onTextChange by Event<CampusSearchBarTextEvent>()
      val onFocusChange by Event<CampusSearchBarFocusEvent>()
      val onCancel by Event<Unit>()

      Content { props ->
        CampusSearchBarContent(
          props = props,
          onTextChange = { text -> onTextChange(CampusSearchBarTextEvent(value = text)) },
          onFocusChange = { focused, hasText ->
            onFocusChange(CampusSearchBarFocusEvent(value = focused, hasText = hasText))
          },
          onCancel = { onCancel(Unit) }
        )
      }
    }
  }
}
