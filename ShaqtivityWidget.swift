import WidgetKit
import SwiftUI

// Step 1: Define the data model for the Widget
struct Provider: TimelineProvider {
    let appGroupID = "group.com.shafinislam.shaqtivity"
    
    func placeholder(in context: Context) -> ShaqEntry {
        ShaqEntry(date: Date(), level: 10, effortXp: 5000, avatarName: "male_01")
    }

    func getSnapshot(in context: Context, completion: @escaping (ShaqEntry) -> ()) {
        let entry = ShaqEntry(date: Date(), level: 10, effortXp: 5000, avatarName: "male_01")
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> ()) {
        // Fetch real data from the App Group UserDefaults populated by our Capacitor Plugin
        var level = 1
        var effortXp = 0
        var avatarName = "male_01"
        
        if let sharedDefaults = UserDefaults(suiteName: appGroupID) {
            level = sharedDefaults.integer(forKey: "level")
            effortXp = sharedDefaults.integer(forKey: "effortXp")
            
            // Convert web path ("/avatars/male/male_01.png") to asset name ("male_01")
            let rawUrl = sharedDefaults.string(forKey: "avatarUrl") ?? "/avatars/male/male_01.png"
            let components = rawUrl.components(separatedBy: "/")
            if let last = components.last {
                avatarName = last.replacingOccurrences(of: ".png", with: "")
            }
        }
        
        // Ensure level isn't 0
        if level == 0 { level = 1 }
        
        let entry = ShaqEntry(date: Date(), level: level, effortXp: effortXp, avatarName: avatarName)
        let timeline = Timeline(entries: [entry], policy: .atEnd)
        completion(timeline)
    }
}

// Step 2: Define the Entry
struct ShaqEntry: TimelineEntry {
    let date: Date
    let level: Int
    let effortXp: Int
    let avatarName: String
}

// Step 3: Define the Widget UI View
struct ShaqtivityWidgetEntryView : View {
    var entry: Provider.Entry

    var body: some View {
        ZStack {
            // Background
            Color.black
            
            // Outer Border
            RoundedRectangle(cornerRadius: 16)
                .stroke(Color(red: 0.2, green: 1.0, blue: 0.2), lineWidth: 4)
                .padding(4)
                
            VStack(spacing: 4) {
                // Title
                Text("SHAQTIVITY")
                    .font(.system(size: 14, weight: .bold, design: .monospaced))
                    .foregroundColor(Color(red: 0.2, green: 1.0, blue: 0.2))
                    .padding(.top, 8)
                
                // Avatar Image (We expect the avatar images to be added to the Widget Target's Assets.xcassets!)
                if let uiImage = UIImage(named: entry.avatarName) {
                    Image(uiImage: uiImage)
                        .resizable()
                        .scaledToFit()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    // Fallback block if image isn't loaded properly
                    Rectangle()
                        .fill(Color.gray)
                        .frame(width: 50, height: 50)
                }
                
                // Level & XP Bar
                HStack(spacing: 8) {
                    Text("LVL \(entry.level)")
                        .font(.system(size: 12, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                    
                    // Simple Progress Bar
                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            Rectangle()
                                .fill(Color.white.opacity(0.3))
                                .frame(height: 8)
                            
                            // Calculate percentage (XP out of Level * 500)
                            let requiredXp = entry.level * 500
                            let progress = min(CGFloat(entry.effortXp) / CGFloat(requiredXp), 1.0)
                            
                            Rectangle()
                                .fill(Color(red: 1.0, green: 0.6, blue: 0.0)) // Orange
                                .frame(width: geometry.size.width * progress, height: 8)
                        }
                        .border(Color.white, width: 1)
                    }
                    .frame(height: 8)
                }
                .padding(.horizontal, 16)
                .padding(.bottom, 12)
            }
        }
    }
}

// Step 4: Define the Main Widget Configuration
@main
struct ShaqtivityWidget: Widget {
    let kind: String = "ShaqtivityWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            ShaqtivityWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Shaqtivity")
        .description("Track your RPG Fitness level right on your home screen.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
