import Foundation
import Capacitor
import WidgetKit

@objc(WidgetSyncPlugin)
public class WidgetSyncPlugin: CAPPlugin {
    
    // We will use an App Group to share memory with the Widget Extension
    let appGroupID = "group.com.shafinislam.shaqtivity"
    
    @objc func syncData(_ call: CAPPluginCall) {
        let level = call.getInt("level") ?? 1
        let effortXp = call.getInt("effortXp") ?? 0
        let avatarUrl = call.getString("avatarUrl") ?? "/avatar_front.png"
        
        // Save to the App Group UserDefaults so the Widget can read it
        if let sharedDefaults = UserDefaults(suiteName: appGroupID) {
            sharedDefaults.set(level, forKey: "level")
            sharedDefaults.set(effortXp, forKey: "effortXp")
            sharedDefaults.set(avatarUrl, forKey: "avatarUrl")
            
            // Tell iOS to immediately refresh all SHAQTIVITY widgets
            WidgetCenter.shared.reloadAllTimelines()
            
            call.resolve([
                "status": "success"
            ])
        } else {
            call.reject("Could not access App Group UserDefaults. Ensure App Groups are configured correctly in Xcode.")
        }
    }
}
