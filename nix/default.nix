{
  version,
  symlinkJoin,
  astal3,
  astal4,
  gtk4-layer-shell,
  astal-io,
  lib,
  buildGoModule,
  buildNpmPackage,
  wrapGAppsHook3,
  gobject-introspection,
  glib,
  gjs,
  bash,
  nodejs,
  dart-sass,
  libsoup_3,
  blueprint-compiler,
  coreutils,
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
    bash
    coreutils
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

  gjsPackage = buildNpmPackage {
    name = "ags-js-lib";
    src = lib.cleanSourceWith {
      src = ../.;
      filter = path: type: let
        relPath = lib.removePrefix (toString ../.) (toString path);
      in
        builtins.any (p: lib.hasPrefix p relPath) [
          "/lib"
          "/package.json"
          "/package-lock.json"
        ];
    };
    dontBuild = true;
    npmDepsHash = "sha256-TjraW0c2HVHn58Cr2XYkeiCikeEy4rRM/53u1Sp4Sgc=";
    installPhase = ''
      mkdir -p $out/lib
      mkdir -p $out/node_modules
      cp -r lib/* $out/lib
      cp -r node_modules/gnim $out/node_modules
      cp -r package.json $out/package.json
      cp -r package-lock.json $out/package-lock.json
    '';
  };
in
  buildGoModule {
    inherit pname version buildInputs;

    src = ../cli;

    vendorHash = "sha256-UHMHbUGqJeUTw0AHHyTdQ8ed5z+SFyPcdXs4shC+hoI=";
    proxyVendor = true;

    nativeBuildInputs = [
      wrapGAppsHook3
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

      mkdir -p $out/share/ags/js
      cp -r ${gjsPackage}/* $out/share/ags/js
    '';

    ldflags = [
      "-X main.agsJsPackage=${gjsPackage}"
      "-X main.gtk4LayerShell=${gtk4-layer-shell}/lib/libgtk4-layer-shell.so"
      "-X main.gjs=${gjs}/bin/gjs"
      "-X main.bash=${bash}/bin/bash"
      "-X main.cat=${coreutils}/bin/cat"
      "-X main.base64=${coreutils}/bin/base64"
    ];

    passthru = {
      jsPackage = gjsPackage;
    };

    meta = {
      homepage = "https://github.com/Aylur/ags";
      description = "Scaffolding CLI tool for Astal+Gnim projects";
      license = lib.licenses.gpl3Plus;
      mainProgram = "ags";
      platforms = lib.platforms.linux;
    };
  }
