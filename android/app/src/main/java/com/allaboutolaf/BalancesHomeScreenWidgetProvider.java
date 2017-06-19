package com.allaboutolaf;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.widget.RemoteViews;

/**
 * Created by everdoorn on 6/18/17.
 */

public class BalancesHomeScreenWidgetProvider extends AppWidgetProvider {

    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        int n = appWidgetIds.length;

        WidgetAmountsProvider parser = new WidgetAmountsProvider("data.json");
        for (int i = 0; i < n; i++) {
            RemoteViews remoteViews = new RemoteViews(context.getPackageName(), R.layout.balances_home_screen_widget);

            String flexAmount, oleAmount, printAmount, mealsTodayAmount, mealsThisWeekAmount;

            // testing
            flexAmount = "$12.34";
            oleAmount = "$12.34";
            printAmount = "$12.34";
            mealsTodayAmount = "2";
            mealsThisWeekAmount = "14";
            remoteViews.setTextViewText(R.id.widget_home_screen_flex_amount, flexAmount);
            remoteViews.setTextViewText(R.id.widget_home_screen_ole_amount, oleAmount);
            remoteViews.setTextViewText(R.id.widget_home_screen_print_amount, printAmount);
            remoteViews.setTextViewText(R.id.widget_meals_today_amount, mealsTodayAmount);
            remoteViews.setTextViewText(R.id.widget_meals_this_week_amount, mealsThisWeekAmount);

            appWidgetManager.updateAppWidget(appWidgetIds[i], remoteViews);
        }
    }
}
