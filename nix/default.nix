{
  astal3,
  astal4,
  gtk4-layer-shell,
  astal-io,
  astal-gjs,
  lib,
  writers,
  buildGoModule,
  wrapGAppsHook,
  gobject-introspection,
  glib,
  gjs,
  nodejs,
  dart-sass,
  blueprint-compiler,
  installShellFiles,
  extraPackages ? [],
}: let
  inherit (builtins) replaceStrings readFile;

  datadirs = writers.writeNu "datadirs" ''
    $env.XDG_DATA_DIRS
    | split row ":"
    | filter { $"($in)/gir-1.0" | path exists }
    | str join ":"
  '';

  bins = [
    gjs
    nodejs
    dart-sass
    blueprint-compiler
    astal-io # FIXME: should not be needed after the astal commends are properly implemented using dbus in astal.go
  ];

  version = replaceStrings ["\n"] [""] (readFile ../version);
  pname = "ags";
in
  buildGoModule {
    inherit pname version;

    src = lib.fileset.toSource {
      root = ../.;
      fileset = lib.fileset.unions [
        ../go.mod
        ../go.sum
        ../version

        ../main.go
        ../cmd
        ../lib
        ../data
      ];
    };

    vendorHash = "sha256-Pw6UNT5YkDVz4HcH7b5LfOg+K3ohrBGPGB9wYGAQ9F4=";
    proxyVendor = true;

    nativeBuildInputs = [
      wrapGAppsHook
      gobject-introspection
      installShellFiles
    ];

    buildInputs =
      extraPackages
      ++ [
        glib
        astal-io
        astal3
        astal4
      ];

    preFixup = ''
      gappsWrapperArgs+=(
        --prefix NIX_GI_DIRS : "$(${datadirs})"
        --prefix PATH : "${lib.makeBinPath (bins ++ extraPackages)}"
      )
    '';

    postInstall = ''
      installShellCompletion \
        --cmd ags \
        --bash <($out/bin/ags completion bash) \
        --fish <($out/bin/ags completion fish) \
        --zsh <($out/bin/ags completion zsh)
    '';

    ldflags = [
      "-X main.astalGjs=${astal-gjs}"
      "-X main.gtk4LayerShell=${gtk4-layer-shell}/lib/libgtk4-layer-shell.so"
    ];

    meta = {
      homepage = "https://github.com/Aylur/ags";
      description = "Scaffolding CLI tool for Astal+TypeScript projects";
      license = lib.licenses.gpl3Plus;
      mainProgram = "ags";
      platforms = lib.platforms.linux;
    };
  }
