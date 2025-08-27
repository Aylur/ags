package lib

import (
	"slices"
	"strings"

	"github.com/godbus/dbus/v5"
)

func callAstalMethod(instanceName string, methodName string, args []any) any {
	conn, err := dbus.ConnectSessionBus()
	if err != nil {
		Err(err)
	}
	defer conn.Close()

	obj := conn.Object("io.Astal."+instanceName, "/io/Astal/Application")
	call := obj.Call("io.Astal.Application."+methodName, 0, args...)

	if call.Err != nil {
		if dbusErr, ok := call.Err.(dbus.Error); ok {
			if dbusErr.Name == "org.freedesktop.DBus.Error.NoReply" &&
				// is it safe to check for message? are these translated?
				// how else am I supposed to check which error is it?
				dbusErr.Error() == "Remote peer disconnected" {
				return nil // ignore: Quit will throw this error
			}
			if dbusErr.Name == "org.freedesktop.DBus.Error.ServiceUnknown" {
				Err(`instance "` + instanceName + `" is not runnning`)
			}
			Err(dbusErr.Name + ": " + dbusErr.Error())
		}
		Err(call.Err)
	}

	var retvalue any
	call.Store(&retvalue)
	return retvalue
}

func GetInstanceNames() []string {
	conn, err := dbus.ConnectSessionBus()
	if err != nil {
		Err(err)
	}
	defer conn.Close()
	obj := conn.Object("org.freedesktop.DBus", "/org/freedesktop/DBus")

	var names []string
	err = obj.Call("org.freedesktop.DBus.ListNames", 0).Store(&names)
	if err != nil {
		Err(err)
	}

	// Filter to only include Astal services
	filtered := slices.DeleteFunc(slices.Clone(names), func(name string) bool {
		return !strings.HasPrefix(name, "io.Astal.")
	})

	// Map over filtered names to remove the "io.Astal." prefix
	for i, name := range filtered {
		filtered[i] = strings.TrimPrefix(name, "io.Astal.")
	}

	return filtered
}

func QuitInstance(instanceName string) {
	callAstalMethod(instanceName, "Quit", []any{})
}

func OpenInspector(instanceName string) {
	callAstalMethod(instanceName, "Inspector", []any{})
}

func ToggleWindow(instanceName string, windowName string) {
	callAstalMethod(instanceName, "ToggleWindow", []any{windowName})
}

func SendRequest(instanceName string, argv []string) string {
	out := callAstalMethod(instanceName, "Request", []any{argv})
	if str, ok := out.(string); ok {
		return str
	}
	return ""
}
