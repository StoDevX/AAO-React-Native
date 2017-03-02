desc "Build the release notes: branch, commit hash, changelog"
lane :release_notes do |options|
  <<~END
  branch: #{git_branch}
  git commit: #{last_git_commit[:commit_hash]}

  ## Changelog
  #{changelog}
  END
end

desc "Makes a changelog from the time since the last commit"
private_lane :changelog do
  to_ref = ENV["TRAVIS_COMMIT"] || "HEAD"
  from_ref = hockeyapp_version_commit || "HEAD~3"

  sh("git log #{from_ref}..#{to_ref} --pretty='%an, %aD (%h)%n> %s%n'")
    .lines
    .map { |line| '    ' + line }
    .join
end
