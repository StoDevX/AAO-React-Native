platform :ios do
  desc 'Runs all the tests'
  lane :test do
    scan
  end

  desc 'Take screenshots'
  lane :screenshot do
    snapshot
  end

  desc 'Go rogue'
  lane :'go-rogue' do
    activate_rogue_team
  end

  desc 'Provisions the profiles; bumps the build number; builds the app'
  lane :build do
    # make sure we have a copy of the data files
    bundle_data

    # Set up code signing correctly
    # (more information: https://codesigning.guide)
    match(readonly: true)

    activate_rogue_team

    version = get_current_bundle_version(platform: :ios)
    build_number = get_current_build_number(platform: :ios)
    increment_version_number(version_number: "#{version}.#{build_number}",
                             xcodeproj: './ios/AllAboutOlaf.xcodeproj')
    increment_build_number(build_number: build_number,
                           xcodeproj: './ios/AllAboutOlaf.xcodeproj')
    set_package_data(data: { version: "#{version}.#{build_number}" })

    # Build the app
    gym
  end

  desc 'Submit a new Beta Build to HockeyApp'
  lane :beta do
    build

    hockey(
      ipa: './ios/build/AllAboutOlaf.ipa',
      commit_sha: ENV['TRAVIS_COMMIT'],
      notes: release_notes(platform: :ios)
    )
  end

  # Lanes specifically for the CIs
  desc 'Do CI-system keychain setup'
  private_lane :ci_keychains do
    keychain = ENV['MATCH_KEYCHAIN_NAME']
    password = ENV['MATCH_KEYCHAIN_PASSWORD']

    create_keychain(
      name: keychain,
      password: password,
      timeout: 3600
    )

    match(readonly: true)

    sh("security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k #{password} #{keychain}")
  end

  desc 'Run iOS builds or tests, as appropriate'
  lane :"ci-run" do
    authorize_ci_for_keys
    ci_keychains

    # I'd like to test, instead of just building, but... Xcode's tests keep
    # failing on us. So, we just build, if we're not deploying.
    should_deploy = ENV['run_deploy'] == '1'
    if should_deploy
      auto_beta(platform: :ios)
    else
      build
    end
  end

  desc 'In case match needs to be updated - probably never needs to be run'
  lane :"update-match" do
    match(readonly: false)
  end
end
