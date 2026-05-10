//
//  ShaqtivityWidgetLiveActivity.swift
//  ShaqtivityWidget
//
//  Created by Shafin Islam on 5/7/26.
//

import ActivityKit
import WidgetKit
import SwiftUI

struct ShaqtivityWidgetAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        // Dynamic stateful properties about your activity go here!
        var emoji: String
    }

    // Fixed non-changing properties about your activity go here!
    var name: String
}

struct ShaqtivityWidgetLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: ShaqtivityWidgetAttributes.self) { context in
            // Lock screen/banner UI goes here
            VStack {
                Text("Hello \(context.state.emoji)")
            }
            .activityBackgroundTint(Color.cyan)
            .activitySystemActionForegroundColor(Color.black)

        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI goes here.  Compose the expanded UI through
                // various regions, like leading/trailing/center/bottom
                DynamicIslandExpandedRegion(.leading) {
                    Text("Leading")
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text("Trailing")
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("Bottom \(context.state.emoji)")
                    // more content
                }
            } compactLeading: {
                Text("L")
            } compactTrailing: {
                Text("T \(context.state.emoji)")
            } minimal: {
                Text(context.state.emoji)
            }
            .widgetURL(URL(string: "http://www.apple.com"))
            .keylineTint(Color.red)
        }
    }
}

extension ShaqtivityWidgetAttributes {
    fileprivate static var preview: ShaqtivityWidgetAttributes {
        ShaqtivityWidgetAttributes(name: "World")
    }
}

extension ShaqtivityWidgetAttributes.ContentState {
    fileprivate static var smiley: ShaqtivityWidgetAttributes.ContentState {
        ShaqtivityWidgetAttributes.ContentState(emoji: "😀")
     }
     
     fileprivate static var starEyes: ShaqtivityWidgetAttributes.ContentState {
         ShaqtivityWidgetAttributes.ContentState(emoji: "🤩")
     }
}

#Preview("Notification", as: .content, using: ShaqtivityWidgetAttributes.preview) {
   ShaqtivityWidgetLiveActivity()
} contentStates: {
    ShaqtivityWidgetAttributes.ContentState.smiley
    ShaqtivityWidgetAttributes.ContentState.starEyes
}
