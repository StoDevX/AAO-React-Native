package com.allaboutolaf;

import com.facebook.react.modules.storage.ReactDatabaseSupplier;
import com.facebook.react.ReactActivity;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.ReactInstanceManager;
import com.calendarevents.CalendarEventsPackage;
import com.facebook.react.ReactActivityDelegate;
import com.facebook.react.ReactRootView;
import com.swmansion.gesturehandler.react.RNGestureHandlerEnabledRootView;
import android.os.Bundle;
import android.content.Intent;
import android.os.PersistableBundle;
import android.support.annotation.Nullable;
import android.util.Log;
import org.mauritsd.reactnativedynamicbundle.RNDynamicBundleModule;

public class MainActivity extends ReactActivity implements RNDynamicBundleModule.OnReloadRequestedListener {
    private RNDynamicBundleModule module;

    /**
     * Returns the name of the main component registered from JavaScript.
     * This is used to schedule rendering of the component.
     */
    @Override
    protected String getMainComponentName() {
        return "AllAboutOlaf";
    }

    @Override
    protected ReactActivityDelegate createReactActivityDelegate() {
        return new ReactActivityDelegate(this, getMainComponentName()) {
            @Override
            protected ReactRootView createRootView() {
                return new RNGestureHandlerEnabledRootView(MainActivity.this);
            }
        };
    }

    // Set up Bugsnag and DynamicBundle
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        MainApplication app = (MainApplication)this.getApplicationContext();
        app.getReactNativeHost().getReactInstanceManager().addReactInstanceEventListener(new ReactInstanceManager.ReactInstanceEventListener() {
            @Override
            public void onReactContextInitialized(ReactContext context) {
                // this isn't working right yet... commenting this out prevents the crash, but also doesn't set the new module
                MainActivity.this.module = context.getNativeModule(RNDynamicBundleModule.class);
                module.setListener(MainActivity.this);
            }
        });

        long size = 50L * 1024L * 1024L; // 50 MB
        ReactDatabaseSupplier.getInstance(getApplicationContext()).setMaximumSize(size);
    }

    @Override
    protected void onStart() {
        super.onStart();

        if (module != null) {
            module.setListener(this);
        }
    }

    @Override
    public void onReloadRequested() {
        this.runOnUiThread(new Runnable() {
            @Override
            public void run() {
                MainActivity.this.getReactNativeHost().clear();
                MainActivity.this.recreate();
            }
        });
    }

    // Required for react-native-calendar-events
    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        CalendarEventsPackage.onRequestPermissionsResult(requestCode, permissions, grantResults);
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
    }
}
