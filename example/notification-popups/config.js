import { NotificationPopups } from "./notificationPopups.js"

Utils.timeout(100, () => Utils.notify({
    summary: "Notification Popup Example",
    iconName: "info-symbolic",
    body: "Lorem ipsum dolor sit amet, qui minim labore adipisicing "
        + "minim sint cillum sint consectetur cupidatat.",
    actions: {
        "Cool": () => print("pressed Cool"),
    },
}))

App.config({
    style: App.configDir + "/style.css",
    windows: [
        NotificationPopups(),
    ],
})
