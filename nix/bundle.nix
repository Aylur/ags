{
  self,
  pkgs,
}: {
  pkgs ? pkgs,
  entry ? "app.ts",
  src,
  name,
  extraPackages ? [],
  gtk4 ? false,
}:
pkgs.stdenvNoCC.mkDerivation {
  inherit src name;

  nativeBuildInputs = with pkgs; [
    wrapGAppsHook
    gobject-introspection
    gnused
    self.packages.${system}.ags
  ];

  buildInputs =
    extraPackages
    ++ [
      pkgs.gjs
      self.packages.${pkgs.system}.astal4
      self.packages.${pkgs.system}.astal3
      self.packages.${pkgs.system}.io
    ];

  preFixup = ''
    gappsWrapperArgs+=(
      --prefix PATH : ${with pkgs;
      lib.makeBinPath (extraPackages
        ++ [
          dart-sass
          fzf
          gtk3
        ])}
    )

    ${
      if gtk4
      then ''
        gappsWrapperArgs+=(
          --set LD_PRELOAD "${pkgs.gtk4-layer-shell}/lib/libgtk4-layer-shell.so"
        )
      ''
      else ""
    }
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/bin
    mkdir -p $out/share
    cp -r * $out/share
    ags bundle ${entry} $out/bin/${name} -d "SRC='$out/share'"

    chmod +x $out/bin/${name}

    if ! head -n 1 "$out/bin/${name}" | grep -q "^#!"; then
      sed -i '1i #!/${pkgs.gjs}/bin/gjs -m' "$out/bin/${name}"
    fi

    runHook postInstall
  '';

  meta.mainProgram = name;
}
