//
//  ShaqtivityWidgetBundle.swift
//  ShaqtivityWidget
//
//  Created by Shafin Islam on 5/7/26.
//

import WidgetKit
import SwiftUI

@main
struct ShaqtivityWidgetBundle: WidgetBundle {
    var body: some Widget {
        ShaqtivityWidget()
        ShaqtivityWidgetControl()
        ShaqtivityWidgetLiveActivity()
    }
}
