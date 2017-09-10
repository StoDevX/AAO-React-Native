package com.allaboutolaf;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.util.Log;
import android.widget.RemoteViews;

/**
 * All About Olaf
 * Home screen widget to display account balances
 */

public class BalancesHomeScreenWidgetProvider extends AppWidgetProvider {
    private final static String TAG = "HomeScreenWidget";

    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        WidgetAmountsProvider provider = new WidgetAmountsProvider(context.getFilesDir().toString() + "balancesWidgetData.json");
        for (int appWidgetId : appWidgetIds) {
            RemoteViews remoteViews = new RemoteViews(context.getPackageName(), R.layout.balances_home_screen_widget);

            remoteViews.setTextViewText(R.id.widget_home_screen_flex_amount, provider.getFlexAmount());
            remoteViews.setTextViewText(R.id.widget_home_screen_ole_amount, provider.getOleAmount());
            remoteViews.setTextViewText(R.id.widget_home_screen_print_amount, provider.getPrintAmount());
            remoteViews.setTextViewText(R.id.widget_meals_today_amount, provider.getMealsTodayAmount());
            remoteViews.setTextViewText(R.id.widget_meals_this_week_amount, provider.getMealsThisWeekAmount());

            appWidgetManager.updateAppWidget(appWidgetId, remoteViews);
            Log.i(TAG, "updated widget");
        }
    }
}
