{
  version,
  symlinkJoin,
  astal3,
  astal4,
  gtk4-layer-shell,
  astal-io,
  agsJsPackage,
  lib,
  buildGoModule,
  wrapGAppsHook,
  gobject-introspection,
  glib,
  gjs,
  bash,
  nodejs,
  dart-sass,
  libsoup_3,
  blueprint-compiler,
  installShellFiles,
  extraPackages ? [],
}: let
  pname = "ags";

  buildInputs =
    extraPackages
    ++ [
      glib
      astal-io
      astal3
      astal4
      gobject-introspection # needed for type generation
      libsoup_3 # needed by the fetch impl
    ];

  bins = [
    gjs
    nodejs
    dart-sass
    blueprint-compiler
    astal-io # FIXME: should not be needed after the astal commands are properly implemented using dbus in astal.go
  ];

  girDirs = let
    # gir files are usually in `dev` output.
    # `propagatedBuildInputs` are also available in the gjs runtime
    # so we also want to generate types for these.
    depsOf = pkg:
      [(pkg.dev or pkg)]
      ++ (map depsOf (pkg.propagatedBuildInputs or []));
  in
    symlinkJoin {
      name = "gir-dirs";
      paths = lib.flatten (map depsOf buildInputs);
    };
in
  buildGoModule {
    inherit pname version buildInputs;

    src = ../cli;

    vendorHash = "sha256-Pw6UNT5YkDVz4HcH7b5LfOg+K3ohrBGPGB9wYGAQ9F4=";
    proxyVendor = true;

    nativeBuildInputs = [
      wrapGAppsHook
      gobject-introspection
      installShellFiles
    ];

    preFixup = ''
      gappsWrapperArgs+=(
        --prefix EXTRA_GIR_DIRS : "${girDirs}/share/gir-1.0"
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
      "-X main.agsJsPackage=${agsJsPackage}/share/ags/js"
      "-X main.gtk4LayerShell=${gtk4-layer-shell}/lib/libgtk4-layer-shell.so"
      "-X main.gjs=${gjs}/bin/gjs"
      "-X main.bash=${bash}/bin/bash"
    ];

    meta = {
      homepage = "https://github.com/Aylur/ags";
      description = "Scaffolding CLI tool for Astal+Gnim projects";
      license = lib.licenses.gpl3Plus;
      mainProgram = "ags";
      platforms = lib.platforms.linux;
    };
  }
