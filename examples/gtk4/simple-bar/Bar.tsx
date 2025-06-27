import app from "ags/gtk4/app"
import GLib from "gi://GLib"
import Astal from "gi://Astal?version=4.0"
import Gtk from "gi://Gtk?version=4.0"
import Gdk from "gi://Gdk?version=4.0"
import AstalBattery from "gi://AstalBattery"
import AstalPowerProfiles from "gi://AstalPowerProfiles"
import AstalWp from "gi://AstalWp"
import AstalNetwork from "gi://AstalNetwork"
import AstalTray from "gi://AstalTray"
import AstalMpris from "gi://AstalMpris"
import AstalApps from "gi://AstalApps"
import { For, With, createBinding } from "ags"
import { createPoll } from "ags/time"
import { execAsync } from "ags/process"

function Mpris() {
  const mpris = AstalMpris.get_default()
  const apps = new AstalApps.Apps()
  const players = createBinding(mpris, "players")

  return (
    <menubutton>
      <box>
        <For each={players}>
          {(player) => {
            const [app] = apps.exact_query(player.entry)
            return <image visible={!!app.iconName} iconName={app?.iconName} />
          }}
        </For>
      </box>
      <popover>
        <box spacing={4} orientation={Gtk.Orientation.VERTICAL}>
          <For each={players}>
            {(player) => (
              <box spacing={4} widthRequest={200}>
                <box overflow={Gtk.Overflow.HIDDEN} css="border-radius: 8px;">
                  <image
                    pixelSize={64}
                    file={createBinding(player, "coverArt")}
                  />
                </box>
                <box
                  valign={Gtk.Align.CENTER}
                  orientation={Gtk.Orientation.VERTICAL}
                >
                  <label xalign={0} label={createBinding(player, "title")} />
                  <label xalign={0} label={createBinding(player, "artist")} />
                </box>
                <box hexpand halign={Gtk.Align.END}>
                  <button
                    onClicked={() => player.previous()}
                    visible={createBinding(player, "canGoPrevious")}
                  >
                    <image iconName="media-seek-backward-symbolic" />
                  </button>
                  <button
                    onClicked={() => player.play_pause()}
                    visible={createBinding(player, "canControl")}
                  >
                    <box>
                      <image
                        iconName="media-playback-start-symbolic"
                        visible={createBinding(
                          player,
                          "playbackStatus",
                        )((s) => s === AstalMpris.PlaybackStatus.PLAYING)}
                      />
                      <image
                        iconName="media-playback-pause-symbolic"
                        visible={createBinding(
                          player,
                          "playbackStatus",
                        )((s) => s !== AstalMpris.PlaybackStatus.PLAYING)}
                      />
                    </box>
                  </button>
                  <button
                    onClicked={() => player.next()}
                    visible={createBinding(player, "canGoNext")}
                  >
                    <image iconName="media-seek-forward-symbolic" />
                  </button>
                </box>
              </box>
            )}
          </For>
        </box>
      </popover>
    </menubutton>
  )
}

function Tray() {
  const tray = AstalTray.get_default()
  const items = createBinding(tray, "items")

  const init = (btn: Gtk.MenuButton, item: AstalTray.TrayItem) => {
    btn.menuModel = item.menuModel
    btn.insert_action_group("dbusmenu", item.actionGroup)
    item.connect("notify::action-group", () => {
      btn.insert_action_group("dbusmenu", item.actionGroup)
    })
  }

  return (
    <box>
      <For each={items}>
        {(item) => (
          <menubutton $={(self) => init(self, item)}>
            <image gicon={createBinding(item, "gicon")} />
          </menubutton>
        )}
      </For>
    </box>
  )
}

function Wireless() {
  const network = AstalNetwork.get_default()
  const wifi = createBinding(network, "wifi")

  const sorted = (arr: Array<AstalNetwork.AccessPoint>) => {
    return arr.filter((ap) => !!ap.ssid).sort((a, b) => b.strength - a.strength)
  }

  async function connect(ap: AstalNetwork.AccessPoint) {
    // connecting to ap is not yet supported
    // https://github.com/Aylur/astal/pull/13
    try {
      await execAsync(`nmcli d wifi connect ${ap.bssid}`)
    } catch (error) {
      // you can implement a popup asking for password here
      console.error(error)
    }
  }

  return (
    <box visible={wifi(Boolean)}>
      <With value={wifi}>
        {(wifi) =>
          wifi && (
            <menubutton>
              <image iconName={createBinding(wifi, "iconName")} />
              <popover>
                <box orientation={Gtk.Orientation.VERTICAL}>
                  <For each={createBinding(wifi, "accessPoints")(sorted)}>
                    {(ap: AstalNetwork.AccessPoint) => (
                      <button onClicked={() => connect(ap)}>
                        <box spacing={4}>
                          <image iconName={createBinding(ap, "iconName")} />
                          <label label={createBinding(ap, "ssid")} />
                          <image
                            iconName="object-select-symbolic"
                            visible={createBinding(
                              wifi,
                              "activeAccessPoint",
                            )((active) => active === ap)}
                          />
                        </box>
                      </button>
                    )}
                  </For>
                </box>
              </popover>
            </menubutton>
          )
        }
      </With>
    </box>
  )
}

function AudioOutput() {
  const { defaultSpeaker: speaker } = AstalWp.get_default()!

  return (
    <menubutton>
      <image iconName={createBinding(speaker, "volumeIcon")} />
      <popover>
        <box>
          <slider
            widthRequest={260}
            onChangeValue={({ value }) => speaker.set_volume(value)}
            value={createBinding(speaker, "volume")}
          />
        </box>
      </popover>
    </menubutton>
  )
}

function Battery() {
  const battery = AstalBattery.get_default()
  const powerprofiles = AstalPowerProfiles.get_default()

  const percent = createBinding(
    battery,
    "percentage",
  )((p) => `${Math.floor(p * 100)}%`)

  const setProfile = (profile: string) => {
    powerprofiles.set_active_profile(profile)
  }

  return (
    <menubutton visible={createBinding(battery, "isPresent")}>
      <box>
        <image iconName={createBinding(battery, "iconName")} />
        <label label={percent} />
      </box>
      <popover>
        <box orientation={Gtk.Orientation.VERTICAL}>
          {powerprofiles.get_profiles().map(({ profile }) => (
            <button onClicked={() => setProfile(profile)}>
              <label label={profile} xalign={0} />
            </button>
          ))}
        </box>
      </popover>
    </menubutton>
  )
}

function Clock({ format = "%H:%M" }) {
  const time = createPoll("", 1000, () => {
    return GLib.DateTime.new_now_local().format(format)!
  })

  return (
    <menubutton>
      <label label={time} />
      <popover>
        <Gtk.Calendar />
      </popover>
    </menubutton>
  )
}

export default function Bar(gdkmonitor: Gdk.Monitor) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor

  return (
    <window
      visible
      name="bar"
      gdkmonitor={gdkmonitor}
      exclusivity={Astal.Exclusivity.EXCLUSIVE}
      anchor={TOP | LEFT | RIGHT}
      application={app}
    >
      <centerbox>
        <box $type="start">
          <Clock />
          <Mpris />
        </box>
        <box $type="end">
          <Tray />
          <Wireless />
          <AudioOutput />
          <Battery />
        </box>
      </centerbox>
    </window>
  )
}
