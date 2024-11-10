{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    astal = {
      url = "github:aylur/astal";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = {
    self,
    nixpkgs,
    astal,
  }: let
    inherit (astal.packages.${system}) astal3 astal4 io gjs;

    system = "x86_64-linux"; # TODO: other architectures
    pkgs = nixpkgs.legacyPackages.x86_64-linux;

    astal-io = io;
    astal-gjs = "${gjs}/share/astal/gjs";

    agsPackages = {
      default = self.packages.${system}.ags;
      ags = pkgs.callPackage ./nix {
        inherit astal3 astal4 astal-io astal-gjs;
      };
      agsFull = pkgs.callPackage ./nix {
        inherit astal3 astal4 astal-io astal-gjs;
        extraPackages = builtins.attrValues (
          builtins.removeAttrs astal.packages.${system} ["docs"]
        );
      };
    };
  in {
    packages.${system} = astal.packages.${system} // agsPackages;

    homeManagerModules = {
      default = self.homeManagerModules.ags;
      ags = import ./nix/hm-module.nix self;
    };
  };
}
