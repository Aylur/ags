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
    system = "x86_64-linux"; # TODO: other architectures
    pkgs = import nixpkgs {inherit system;};

    agsPackages = {
      default = self.packages.${system}.ags;
      ags = pkgs.callPackage ./nix (with astal.packages.${system}; {
        inherit astal3 astal4;
        astal-io = io;
        astal-gjs = "${gjs}/share/astal/gjs";
      });
      agsFull = pkgs.callPackage ./nix (with astal.packages.${system}; {
        inherit astal3 astal4;
        astal-io = io;
        astal-gjs = "${gjs}/share/astal/gjs";
        extraPackages = builtins.attrValues (
          builtins.removeAttrs astal.packages.${system} ["docs"]
        );
      });
    };
  in {
    packages.${system} = astal.packages.${system} // agsPackages;

    homeManagerModules = {
      default = self.homeManagerModules.ags;
      ags = import ./nix/hm-module.nix self;
    };
  };
}
