platform :ios do
  desc 'Runs all the tests'
  lane :test do
    scan(scheme: ENV['GYM_SCHEME'], project: ENV['GYM_PROJECT'])
  end

  desc 'Take screenshots'
  lane :screenshot do
    snapshot(devices: ['iPhone 7 Plus', 'iPhone 6', 'iPhone 5s'],
             languages: ['en-US'],
             scheme: ENV['GYM_SCHEME'],
             project: ENV['GYM_PROJECT'])
  end

  desc 'Builds the app'
  lane :build do
    propagate_version
    gym(include_bitcode: true,
        include_symbols: true)
  end

  desc 'Submit a new Beta Build to Testflight'
  lane :beta do
    match(type: 'appstore', readonly: true)
    build
    testflight
  end

  desc 'Submit a new nightly Beta Build to Testflight'
  lane :nightly do
    match(type: 'appstore', readonly: true)
    build
    testflight(distribute_external: false)
  end

  desc 'Upload dYSM symbols to Bugsnag from Apple'
  lane :refresh_dsyms do
    download_dsyms
    upload_symbols_to_bugsnag
    clean_build_artifacts
  end

  desc 'Run iOS builds or tests, as appropriate'
  lane :'ci-run' do
    # set up things so they can run
    authorize_ci_for_keys

    # and run
    auto_beta
  end
end
