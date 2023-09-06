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
  version = "1.1.0";

  src = buildNpmPackage {
    name = "ags";
    src = ../.;

    dontBuild = true;

    npmDepsHash = "sha256-4BNbFi/Ltg/8tuicrrMBIdOhteEIs85Zqj9oI/hYbl0=";

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

  patches = [
    ./gvc-path.patch
  ];
  
  nativeBuildInputs = [
    nodePackages.typescript
    meson
    pkg-config
    ninja
  ];

  buildInputs = [
    gobject-introspection
    gjs
    gtk3
    libpulseaudio
  ];

  meta = with lib; {
    description = "A customizable and extensible shell";
    homepage = "https://github.com/Aylur/ags";
    platforms = [ "x86_64-linux" "aarch64-linux" ];
    license = licenses.gpl3;
  };
}
