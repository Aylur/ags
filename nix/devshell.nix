{
  self,
  astal,
  pkgs,
}: let
  astalPackages = with astal.packages.${pkgs.system}; [
    io
    astal3
    astal4
  ];

  packages = with pkgs; [
    wrapGAppsHook
    gobject-introspection
    libadwaita
  ];

  devPackages = with pkgs; [
    markdownlint-cli2
    marksman
    vtsls
    mesonlsp
    vscode-langservers-extracted
    nodePackages.npm
    go
    gopls
    gotools
    gofumpt
    go-tools
    meson
    ninja
    pkg-config
  ];
in {
  default = pkgs.mkShell {
    packages = astalPackages ++ devPackages ++ packages;
  };
}
