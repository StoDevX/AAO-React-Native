require 'json'

PLATFORM = ENV.fetch('task', 'unknown')

def sh(cmd)
  puts "$ #{cmd}"
  output = `#{cmd}`.chomp
  puts output
  output
end

def git_branch
  sh('git rev-parse --abbrev-ref HEAD')
end

# diff two hashes at a path and return the changed items
def deps_diff(old_hash, new_hash, path)
  (new_hash.dig(*path).to_a - old_hash.dig(*path).to_a).to_h
end

NPM_DEP_NAME_REGEXP = /react|jsc/.freeze
def npm_native_package_changed?
  old_package = JSON.parse(sh("git show '#{source_branch}:package.json'"))
  new_package = JSON.parse(sh("git show '#{current_branch}:package.json'"))

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

  case PLATFORM
  when 'ANDROID'
    base_globs + [
      'android/**',
      '{modules,source}/**/*.{java,gradle}',
    ]
  when 'IOS'
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
    puts("should_build? branch == #{source_branch}, so yes")
    return true
  end

  # 1. need to get files changed in the current build since master
  changed_files = sh("git log --name-only --format='' '#{source_branch}'..'#{current_branch}'").lines.sort.uniq

  # 2. check for "packages we care about"
  if changed_files.include? 'package.json' and npm_native_package_changed?
    puts("should_build? some dependency matching #{NPM_DEP_NAME_REGEXP.inspect} changed, so yes")
    return true
  end

  # 3. compare list of files to our sets of "files we care about"
  if native_file_changed?(changed_files)
    puts('should_build? some native file changed, so yes')
    return true
  end

  # 4) if none matched, return false
  puts('should_build? no')
  false
end

def main
  puts should_build?
end

main
