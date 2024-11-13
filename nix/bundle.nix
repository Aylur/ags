{
  self,
  pkgs,
}: {
  pkgs ? pkgs,
  entry ? "app.ts",
  src,
  name,
  extraPackages ? [],
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
  '';

  installPhase = ''
    runHook preInstall

    mkdir -p $out/bin
    mkdir -p $out/share
    cp -r * $out/share
    ags bundle ${entry} $out/bin/${name} --src $out/share

    chmod +x $out/bin/${name}

    if ! head -n 1 "$out/bin/${name}" | grep -q "^#!"; then
      sed -i '1i #!/${pkgs.gjs}/bin/gjs -m' "$out/bin/${name}"
    fi

    runHook postInstall
  '';
}
