import Foundation
import Capacitor

CAP_PLUGIN(WidgetSyncPlugin, "WidgetSync",
    CAP_PLUGIN_METHOD(syncData, CAPPluginReturnPromise);
)
