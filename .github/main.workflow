workflow "on-push" {
  on = "push"
  resolves = ["lint", "formatting", "validate-data"]
}

action "lint" {
  uses = "actions/npm@v2.0.0"
  runs = "yarn && yarn lint"
}

action "formatting" {
  uses = "actions/npm@v2.0.0"
  args = "yarn && yarn pretty -c"
}

action "validate-data" {
  needs = ["data/bus", "data/general"]
  uses = "actions/npm@v2.0.0"
  runs = "yarn"
}

action "data/bus" {
  uses = "actions/npm@v2.0.0"
  runs = "yarn && yarn data && yarn validate-bus-data"
}

action "data/general" {
  uses = "actions/npm@v2.0.0"
  runs = "yarn && yarn data && yarn validate-data"
}
