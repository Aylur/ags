import { App } from "astal"
import style from "inline:./style.css"
import Bar from "./widget/Bar"

App.start({
    css: style,
    main() {
        Bar(0)
        // Bar(1) // initialize other monitors
    },
})
