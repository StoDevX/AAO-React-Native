package com.allaboutolaf;

import android.app.IntentService;
import android.content.Intent;
import android.os.StrictMode;
import android.support.annotation.Nullable;
import android.util.Log;

import com.squareup.okhttp.MediaType;
import com.squareup.okhttp.OkHttpClient;
import com.squareup.okhttp.Request;
import com.squareup.okhttp.RequestBody;
import com.squareup.okhttp.Response;

import java.io.IOException;
import java.util.logging.Logger;

/**
 * Created by everdoorn on 8/8/17.
 */

public class BalancesIntentService extends IntentService {
    public static final MediaType JSON = MediaType.parse("application/json; charset=utf-8");
    OkHttpClient client = new OkHttpClient();

    public BalancesIntentService() {
        super("BalancesIntentServices");
    }

    private String get(String url, String json) throws IOException {
                RequestBody body = RequestBody.create(JSON, json);
                Request request = new Request.Builder()
                        .url(url)
                        .post(body)
                        .build();
        try {
            Response response = client.newCall(request).execute();
            return response.body().string();
        } finally {
            return null;
        }
    }

    @Override
    protected void onHandleIntent(@Nullable Intent intent) {
        try {
            String url = getResources().getString(R.string.balances_url);
            String response = get(url, getUserLoginJson());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            Log.e("BalancesIntentService", e.toString());
        } catch (IOException e) {

        }
    }

    private String getUserLoginJson() {

    }
}
