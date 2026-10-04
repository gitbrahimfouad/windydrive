package com.windydrive.leaderboard;

import android.app.Activity;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.games.PlayGames;
import com.google.android.gms.games.PlayGamesSdk;

/**
 * Google Play Games Services leaderboards.
 * JS API (see src/platform/capacitor.ts): initialize(), submitScore({leaderboardId, score}), show().
 */
@CapacitorPlugin(name = "Leaderboard")
public class LeaderboardPlugin extends Plugin {

    private static final int RC_LEADERBOARD = 9004;
    private boolean sdkReady = false;

    /** Initialises the SDK once (it signs the player in automatically when possible). */
    private void ensureSdk() {
        if (!sdkReady) {
            PlayGamesSdk.initialize(getContext());
            sdkReady = true;
        }
    }

    private static JSObject result(String key, boolean value) {
        JSObject r = new JSObject();
        r.put(key, value);
        return r;
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        ensureSdk();
        call.resolve();
    }

    /** Resolves { submitted: false } (no error) when the player is not signed in. */
    @PluginMethod
    public void submitScore(PluginCall call) {
        String leaderboardId = call.getString("leaderboardId");
        Integer score = call.getInt("score");
        if (leaderboardId == null || score == null) {
            call.reject("leaderboardId and score are required");
            return;
        }
        ensureSdk();
        final Activity activity = getActivity();
        PlayGames.getGamesSignInClient(activity).isAuthenticated().addOnCompleteListener(task -> {
            boolean signedIn = task.isSuccessful() && task.getResult() != null && task.getResult().isAuthenticated();
            if (!signedIn) {
                call.resolve(result("submitted", false));
                return;
            }
            PlayGames.getLeaderboardsClient(activity).submitScore(leaderboardId, score.longValue());
            call.resolve(result("submitted", true));
        });
    }

    /** Opens the Play Games leaderboards, asking the player to sign in first if needed. */
    @PluginMethod
    public void show(PluginCall call) {
        ensureSdk();
        final Activity activity = getActivity();
        PlayGames.getGamesSignInClient(activity).isAuthenticated().addOnCompleteListener(task -> {
            boolean signedIn = task.isSuccessful() && task.getResult() != null && task.getResult().isAuthenticated();
            if (signedIn) {
                openLeaderboards(activity, call);
            } else {
                PlayGames.getGamesSignInClient(activity).signIn().addOnCompleteListener(signInTask -> {
                    boolean ok = signInTask.isSuccessful() && signInTask.getResult() != null && signInTask.getResult().isAuthenticated();
                    if (ok) {
                        openLeaderboards(activity, call);
                    } else {
                        call.resolve(result("shown", false));
                    }
                });
            }
        });
    }

    private void openLeaderboards(Activity activity, PluginCall call) {
        PlayGames.getLeaderboardsClient(activity)
            .getAllLeaderboardsIntent()
            .addOnSuccessListener(intent -> {
                activity.startActivityForResult(intent, RC_LEADERBOARD);
                call.resolve(result("shown", true));
            })
            .addOnFailureListener(e -> call.reject(e.getMessage() == null ? "Could not open leaderboards" : e.getMessage()));
    }
}
