package com.allaboutolaf;

import android.app.Application;
import android.net.http.HttpResponseCache;
import android.util.Log;

import com.facebook.react.PackageList;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.soloader.SoLoader;

import java.io.File;
import java.io.IOException;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      @SuppressWarnings("UnnecessaryLocalVariable")
      List<ReactPackage> packages = new PackageList(this).getPackages();
      // Packages that cannot be autolinked yet can be added manually here, for example:
      // packages.add(new MyReactNativePackage());
      return packages;
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
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
