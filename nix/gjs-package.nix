{
  meson,
  ninja,
  pkg-config,
  stdenv,
  gjsx,
  version,
  runCommand,
}:
stdenv.mkDerivation {
  pname = "ags";
  inherit version;

  # FIXME: how do I pull submodules without "?submodules=1"?
  src = runCommand "ags" {} ''
    mkdir -p $out/lib/gjsx
    cp ${../meson.build} $out/meson.build
    cp -r ${../lib}/* $out/lib
    cp -r ${gjsx}/* $out/lib/gjsx
    chmod -R u+w $out
  '';

  nativeBuildInputs = [
    meson
    ninja
    pkg-config
  ];
}
