package tech.frogpond.placecardheader

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class PlaceCardHeaderModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("PlaceCardHeader")

    View<PlaceCardHeaderProps>("PlaceCardHeaderView") {
      Content { props ->
        PlaceCardHeaderContent(props)
      }
    }

    View<PlaceCardScaffoldProps>("PlaceCardScaffoldView") {
      Content { props ->
        PlaceCardScaffoldContent(props)
      }
    }

    View<PlaceCardAboutProps>("PlaceCardAboutView") {
      Content { props ->
        PlaceCardAboutContent(props)
      }
    }
  }
}
