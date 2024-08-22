import Astal from "gi://Astal";
import { stdout } from "@/lib/console";
import { exit } from "system";

export function list() {
    stdout.puts(Astal.Application.get_instances().join("\n"))
    exit(0)
}

export function quit(instance: string) {
    try {
        Astal.Application.quit_instance(instance)
        exit(0)
    } catch (error) {
        stdout.err(error)
        exit(1)
    }
}

export function message(instance: string, message: string) {
    try {
        Astal.Application.send_message(instance, message)
        exit(0)
    } catch (error) {
        stdout.err(error)
        exit(1)
    }
}

export function inspector(instance: string) {
    try {
        Astal.Application.open_inspector(instance)
        exit(0)
    } catch (error) {
        stdout.err(error)
        exit(1)
    }
}

export function toggle(instance: string, window: string) {
    try {
        Astal.Application.toggle_window_by_name(instance, window)
        exit(0)
    } catch (error) {
        stdout.err(error)
        exit(1)
    }
}
