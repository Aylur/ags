{
  astal3,
  astal-io,
  astal-gjs,
  lib,
  writers,
  buildGoModule,
  wrapGAppsHook,
  gobject-introspection,
  gtk3,
  glib,
  gjs,
  nodejs,
  dart-sass,
  extraPackages ? [ ],
}:
let
  inherit (builtins) replaceStrings readFile;

  datadirs =
    writers.writeNu "datadirs" # nu
      ''
        $env.XDG_DATA_DIRS
        | split row ":"
        | filter { $"($in)/gir-1.0" | path exists }
        | str join ":"
      '';

  bins = [
    gjs
    nodejs
    dart-sass
    astal-io # FIXME: should not be needed after the astal commends are properly implemented using dbus in astal.go
  ];
in
buildGoModule {
  version = replaceStrings [ "\n" ] [ "" ] (readFile ./version);
  pname = "ags";
  src = ./.;

  vendorHash = "sha256-MXappgAYaFcxYQVck4fxbAFS1Hn9KsoOOpzmZBgxuM0=";

  nativeBuildInputs = [
    wrapGAppsHook
    gobject-introspection
  ];

  buildInputs = extraPackages ++ [
    glib
    gtk3
    astal-io
    astal3
  ];

  preFixup = ''
    gappsWrapperArgs+=(
      --prefix NIX_GI_DIRS : "$(${datadirs})"
      --prefix PATH : "${lib.makeBinPath (bins ++ extraPackages)}"
    )
  '';

  ldflags = [
    "-X main.astalGjs=${astal-gjs}"
  ];
}
