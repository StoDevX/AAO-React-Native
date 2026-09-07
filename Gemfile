source 'https://rubygems.org'

gem 'netrc', '0.11.0'
gem 'json', '2.21.2'

# CocoaPods lives here rather than in mise's [tools] so this json pin reaches
# it. json 3.0.0 dropped the quirks_mode keyword that activesupport still
# passes, which breaks pod install outright; mise installs CocoaPods into an
# isolated gem tree that no Gemfile constrains. Expo's prebuild runs
# `bundle exec pod` once a Gemfile names cocoapods.
gem 'cocoapods', '1.17.0'

# Ruby 3.4 stdlib gems that need to be explicitly required
gem 'abbrev', '0.1.2'
gem 'nkf', '0.3.0'
