# should we build and release to the nightly channel?
def should_nightly?
  travis_cron? || circle_nightly?
end

# are we running under the circleci nightly workflow?
def circle_nightly?
  ENV['IS_NIGHTLY'] == '1'
end

# should we build and release to the beta channel?
def should_beta?
  tagged? || commit_says_deploy?
end

# does the build have the api keys needed for signing?
def api_keys_available?
  ENV['MATCH_PASSWORD'] && ENV['FASTLANE_PASSWORD']
end

# was this build initiated by cron?
def travis_cron?
  ENV['TRAVIS_EVENT_TYPE'] == 'cron'
end

# is this a build of a tagged commit?
def tagged?
  travis = ENV['TRAVIS_TAG'] && !ENV['TRAVIS_TAG'].empty?
  circle = ENV['CIRCLE_TAG'] && !ENV['CIRCLE_TAG'].empty?
  travis || circle
end

# does the commit message tell us to make a new beta?
def commit_says_deploy?
  commit = ENV['TRAVIS_COMMIT_MESSAGE'] || ENV['GIT_COMMIT_DESC']
  commit =~ /\[ci run beta\]/
end

# are we running on travis?
def travis?
  ENV['TRAVIS'] == 'true'
end

# are we running on circle?
def circle?
  ENV['CIRCLECI'] == 'true'
end

# diff two hashes at a path and return the changed items
def deps_diff(old_hash, new_hash, path)
  (new_hash.dig(*path).to_a - old_hash.dig(*path).to_a).to_h
end

NPM_DEP_NAME_REGEXP = /react|jsc/.freeze
def npm_native_package_changed?
  old_package = JSON.parse(sh "git show '#{source_branch}:package.json'")
  new_package = JSON.parse(sh "git show '#{current_branch}:package.json'")

  changed_dependencies = deps_diff(old_package, new_package, ['dependencies']).keys
  changed_devdependencies = deps_diff(old_package, new_package, ['devDependencies']).keys

  (changed_dependencies + changed_devdependencies).any? { |dep| dep =~ NPM_DEP_NAME_REGEXP }
end

def native_build_globs
  base_globs = [
    '.circleci/**',
    'e2e/**',
    'fastlane/**',
    'scripts/**',
    'Gemfile.lock',
  ]

  case lane_context[:PLATFORM_NAME]
  when :android
    base_globs + [
      'android/**',
      '{modules,source}/**/*.{java,gradle}',
    ]
  when :ios
    base_globs + [
      'ios/**',
      '{modules,source}/**/*.{h,m,mm}',
    ]
  else
    base_globs
  end
end

def native_file_changed?(changed_files)
  native_build_globs.any? do |glob|
    changed_files.any? do |path|
      File.fnmatch?(glob, path)
    end
  end
end

# checks if the native build needs to be run
def should_build?
  # Essentially, we want to avoid native builds if the only thing that changed was JS code.

  # TODO: figure out how to determine the actual source branch
  source_branch = 'master'
  current_branch = git_branch

  if source_branch == current_branch
    # if we're on master, we should do the build
    UI.message("should_build? branch == #{source_branch}, so yes")
    return true
  end

  # 1. need to get files changed in the current build since master
  changed_files = sh("git log --name-only --format='' '#{source_branch}'..'#{current_branch}'").lines.sort.uniq

  # 2. check for "packages we care about"
  if changed_files.include? 'package.json' and npm_native_package_changed?
    UI.message("should_build? some dependency matching #{NPM_DEP_NAME_REGEXP.inspect} changed, so yes")
    return true
  end

  # 3. compare list of files to our sets of "files we care about"
  if native_file_changed?(changed_files)
    UI.message('should_build? some native file changed, so yes')
    return true
  end

  # 4) if none matched, return false
  UI.message('should_build? no')
  false
end
