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
}:

let
  gvc-src = fetchFromGitLab {
    domain = "gitlab.gnome.org";
    owner = "GNOME";
    repo = "libgnome-volume-control";
    rev = "8e7a5a4c3e51007ce6579292642517e3d3eb9c50";
    sha256 = "sha256-FosJwgTCp6/EI6WVbJhPisokRBA6oT0eo7d+Ya7fFX8=";
  };
  gi-types-src = fetchFromGitLab {
    domain = "gitlab.gnome.org";
    owner = "BrainBlasted";
    repo = "gi-typescript-definitions";
    rev = "eb2a87a25c5e2fb580b605fbec0bd312fe34c492";
    sha256 = "sha256-MNLrlKeWZI9EDO/8/gaXpAlrWv9B49jSu4keWDh3q9g=";
  };
in
stdenv.mkDerivation {
  pname = "ags";
  version = "1.3.0";

  src = buildNpmPackage {
    name = "ags";
    src = ../.;

    dontBuild = true;

    npmDepsHash = "sha256-1qfFFMzhyKgiDNwaiHjudzfgSeAI9rPwLaSJzC6+RLk=";

    installPhase = ''
      mkdir $out
      cp -r * $out
    '';
  };

  prePatch = ''
    mkdir -p ./subprojects/gvc
    mkdir -p ./gi-types
    cp -r ${gvc-src}/* ./subprojects/gvc
    cp -r ${gi-types-src}/* ./gi-types
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
  ];

  meta = with lib; {
    description = "A customizable and extensible shell";
    homepage = "https://github.com/Aylur/ags";
    platforms = [ "x86_64-linux" "aarch64-linux" ];
    license = licenses.gpl3;
  };
}
