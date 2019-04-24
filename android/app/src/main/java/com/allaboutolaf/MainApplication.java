package com.allaboutolaf;

import android.net.http.HttpResponseCache;
import android.util.Log;

import com.reactnativenavigation.NavigationApplication;
import com.reactnativenavigation.react.NavigationReactNativeHost;
import com.reactnativenavigation.react.ReactGateway;

// keep these sorted alphabetically
import com.avishayil.rnrestart.ReactNativeRestartPackage;
import com.BV.LinearGradient.LinearGradientPackage;
import com.calendarevents.CalendarEventsPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.geektime.rnonesignalandroid.ReactNativeOneSignalPackage;
import com.github.droibit.android.reactnative.customtabs.CustomTabsPackage;
import com.learnium.RNDeviceInfo.RNDeviceInfo;
import com.mapbox.rctmgl.RCTMGLPackage;
import com.oblador.keychain.KeychainPackage;
import com.oblador.vectoricons.VectorIconsPackage;
import com.pusherman.networkinfo.RNNetworkInfoPackage;

import io.sentry.RNSentryPackage;

import java.io.File;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

public class MainApplication extends NavigationApplication {

    @Override
    protected ReactGateway createReactGateway() {
        ReactNativeHost host = new NavigationReactNativeHost(this, isDebug(), createAdditionalReactPackages()) {
            @Override
            protected String getJSMainModuleName() {
                return "index";
            }
        };
        return new ReactGateway(this, isDebug(), host);
    }

    @Override
    public boolean isDebug() {
        return BuildConfig.DEBUG;
    }

    protected List<ReactPackage> getPackages() {
        return Arrays.asList(
                new MainReactPackage(),
                // please keep these sorted alphabetically
                new CalendarEventsPackage(),
                new CustomTabsPackage(),
                new KeychainPackage(),
                new LinearGradientPackage(),
                new RCTMGLPackage(),
                new ReactNativeOneSignalPackage(),
                new ReactNativeRestartPackage(),
                new RNDeviceInfo(),
                new RNNetworkInfoPackage(),
                new RNSentryPackage(),
                new VectorIconsPackage()
        );
    }

    @Override
    public List<ReactPackage> createAdditionalReactPackages() {
        return getPackages();
    }

    @Override
    public void onCreate() {
        super.onCreate();
        SoLoader.init(this, /* native exopackage */ false);

        // set up network cache
        try {
            File httpCacheDir = new File(getApplicationContext().getCacheDir(), "http");
            long httpCacheSize = 20 * 1024 * 1024; // 20 MiB
            HttpResponseCache.install(httpCacheDir, httpCacheSize);
        } catch (IOException e) {
            Log.i("allaboutolaf", "HTTP response cache installation failed:", e);
            //      Log.i(TAG, "HTTP response cache installation failed:", e);
        }
    }

    public void onStop() {
        HttpResponseCache cache = HttpResponseCache.getInstalled();
        if (cache != null) {
            cache.flush();
        }
    }
}
