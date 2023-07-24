{ 
  lib,
  stdenv,
  system,
  inputs,
  buildNpmPackage,
  fetchFromGitHub,
  nodePackages,
  meson,
  pkg-config,
  ninja,
  gobject-introspection,
  gtk3,
  libpulseaudio
}:

let
  custom = ./custom;
in
stdenv.mkDerivation {
  pname = "ags";
  version = "1.0.0";

  src = buildNpmPackage {
    name = "ags";
    src = ../.;

    dontBuild = true;

    npmDepsHash = "sha256-e1YYtWiO/dN7w2s+En3+3gc98R/hM5pJnTK7kCCH8Mc=";

    installPhase = ''
      mkdir $out
      cp -r * $out
    '';
  };

  patches = [
    ./lib-path.patch
  ];
  
  nativeBuildInputs = [
    nodePackages.typescript
    meson
    pkg-config
    ninja
  ];

  buildInputs = [
    gobject-introspection
    inputs.dongsu8142-nur.packages.${system}.gtk-gjs
    gtk3
    libpulseaudio
  ];

  meta = with lib; {
    description = "A customizable and extensible shell for Hyprland";
    homepage = "https://github.com/Aylur/ags";
    platforms = [ "x86_64-linux" "aarch64-linux" ];
    license = licenses.gpl3;
  };
}
