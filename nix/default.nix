{ lib
, stdenv
, buildNpmPackage
, fetchFromGitLab
, nodePackages
, meson
, pkg-config
, ninja
, gobject-introspection
, gtk3
, libpulseaudio
, gjs
, python3
, wrapGAppsHook
, upower
, gnome
, gtk-layer-shell
, glib-networking
, networkmanager
, libdbusmenu-gtk3
, gvfs
, extraPackages ? []
}:

let
  gvc-src = fetchFromGitLab {
    domain = "gitlab.gnome.org";
    owner = "GNOME";
    repo = "libgnome-volume-control";
    rev = "8e7a5a4c3e51007ce6579292642517e3d3eb9c50";
    sha256 = "sha256-FosJwgTCp6/EI6WVbJhPisokRBA6oT0eo7d+Ya7fFX8=";
  };
in
stdenv.mkDerivation {
  pname = "ags";
  version = "1.5.0";

  src = buildNpmPackage {
    name = "ags";
    src = ../.;

    dontBuild = true;

    npmDepsHash = "sha256-+Hg4wEnJrMcs0m0hosDF8+UbhKNGSIcl5NcvAsM6U2Q=";

    installPhase = ''
      mkdir $out
      cp -r * $out
    '';
  };

  prePatch = ''
    mkdir -p ./subprojects/gvc
    cp -r ${gvc-src}/* ./subprojects/gvc
  '';

  postPatch = ''
    chmod +x meson_post_install.py
    patchShebangs meson_post_install.py
  '';

  nativeBuildInputs = [
    pkg-config
    meson
    ninja
    nodePackages.typescript
    python3
    wrapGAppsHook
    gobject-introspection
  ];

  buildInputs = [
    gjs
    gtk3
    libpulseaudio
    upower
    gnome.gnome-bluetooth
    gtk-layer-shell
    glib-networking
    networkmanager
    libdbusmenu-gtk3
    gvfs
  ] ++ extraPackages;

  meta = with lib; {
    description = "A customizable and extensible shell";
    homepage = "https://github.com/Aylur/ags";
    platforms = [ "x86_64-linux" "aarch64-linux" ];
    license = licenses.gpl3;
    meta.maintainers = [lib.maintainers.Aylur];
  };
}
