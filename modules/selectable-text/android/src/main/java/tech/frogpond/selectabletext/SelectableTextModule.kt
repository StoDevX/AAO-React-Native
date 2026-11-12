package tech.frogpond.selectabletext

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class SelectableTextModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("SelectableText")

    View<SelectableTextProps>("SelectableTextView") {
      Content { props ->
        SelectableTextContent(props)
      }
    }
  }
}
