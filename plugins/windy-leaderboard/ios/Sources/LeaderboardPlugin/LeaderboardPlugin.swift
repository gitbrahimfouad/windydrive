import Capacitor
import GameKit

/// Game Center leaderboards.
/// JS API (see src/platform/capacitor.ts): initialize(), submitScore({leaderboardId, score}), show().
@objc(LeaderboardPlugin)
public class LeaderboardPlugin: CAPPlugin, CAPBridgedPlugin, GKGameCenterControllerDelegate {
    public let identifier = "LeaderboardPlugin"
    public let jsName = "Leaderboard"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initialize", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "submitScore", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "show", returnType: CAPPluginReturnPromise)
    ]

    /// Authenticates the local player. iOS shows the Game Center sign-in sheet when needed.
    @objc public func initialize(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            GKLocalPlayer.local.authenticateHandler = { viewController, _ in
                if let viewController = viewController {
                    self?.bridge?.viewController?.present(viewController, animated: true)
                }
            }
            call.resolve()
        }
    }

    /// Submits a score; resolves { submitted: false } (no error) when the player is not signed in.
    @objc public func submitScore(_ call: CAPPluginCall) {
        guard let leaderboardId = call.getString("leaderboardId"), let score = call.getInt("score") else {
            call.reject("leaderboardId and score are required")
            return
        }
        guard GKLocalPlayer.local.isAuthenticated else {
            call.resolve(["submitted": false])
            return
        }
        GKLeaderboard.submitScore(score, context: 0, player: GKLocalPlayer.local, leaderboardIDs: [leaderboardId]) { error in
            if let error = error {
                call.reject(error.localizedDescription)
            } else {
                call.resolve(["submitted": true])
            }
        }
    }

    /// Opens the Game Center leaderboards; resolves { shown: false } when the player is not signed in.
    @objc public func show(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self, GKLocalPlayer.local.isAuthenticated else {
                call.resolve(["shown": false])
                return
            }
            let controller = GKGameCenterViewController(state: .leaderboards)
            controller.gameCenterDelegate = self
            self.bridge?.viewController?.present(controller, animated: true)
            call.resolve(["shown": true])
        }
    }

    public func gameCenterViewControllerDidFinish(_ gameCenterViewController: GKGameCenterViewController) {
        gameCenterViewController.dismiss(animated: true)
    }
}
