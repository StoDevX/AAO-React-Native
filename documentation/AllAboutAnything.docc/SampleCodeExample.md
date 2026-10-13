# Chaos run example

Drive the app at random and read what it finds.

@Metadata {
    @PageKind(sampleCode)
}

## Overview

This is a **sample code** page: an article with a call-to-action button that
links to the code.

@Row {
    @Column {
        Run `mise run chaos:bundled --seed 1234`.
    }
    @Column {
        Evidence lands in `logs/chaos/1234/`.
    }
}

@CallToAction(url: "https://github.com/StoDevX/aao-react-native/tree/master/uitests/Chaos", purpose: link, label: "View the code")
