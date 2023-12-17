import Gio from "gi://Gio";
import Service from "../service.js";

import { loadInterfaceXML } from "../utils.js";
import { PowerProfilesProxy } from "../dbus/types.js";

const PowerProfilesIFace = loadInterfaceXML("net.hadess.PowerProfiles")!;
const PowerProfilesProxy = Gio.DBusProxy.makeProxyWrapper(
  PowerProfilesIFace,
) as unknown as PowerProfilesProxy;

const icon = (name: string) => `power-profile-${name}-symbolic`;

class PowerProfiles extends Service {
  // deno-lint-ignore no-explicit-any
  [x: string]: any;
  static {
    Service.register(this, {
      "profile-released": ["int"],
    }, {
      "actions": ["string", "r"],
      "active-profile": ["string", "rw"],
      "active-profile-holds": ["jsobject", "r"],
      "performance-degraded": ["string", "r"],
      "profiles": ["jsobject", "r"],
      "icon": ["string", "r"],
    });
  }

  #proxy = PowerProfilesProxy;

  constructor() {
    super();

    this.#proxy = new PowerProfilesProxy(
      Gio.DBus.system,
      "net.hadess.PowerProfiles",
      "/net/hadess/PowerProfiles",
    );
  }

  get actions() {
    return this.#proxy.Actions;
  }

  get profiles() {
    return this.#proxy.Profiles.map((p) => {
      return {
        profile: p.Profile,
        driver: p.Driver,
        icon: icon(p.Profile),
      };
    });
  }

  get activeProfile() {
    return this.#proxy.ActiveProfile;
  }

  set activeProfile(profile) {
    this.#proxy.ActiveProfile = profile;
    this.notify("icon");
    this.notify("active-profile");
  }

  get activeProfileHolds() {
    return this.#proxy.ActiveProfileHolds;
  }

  get performanceDegraded() {
    return this.#proxy.PerformanceDegraded;
  }

  get icon() {
    return icon(this.#proxy.ActiveProfile);
  }
}

const service = new PowerProfiles();

export default service;
