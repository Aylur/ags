{
  description = "A customizable and extensible shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = {
    nixpkgs,
    self,
  }: let
    version = builtins.replaceStrings ["\n"] [""] (builtins.readFile ./version);
    genSystems = nixpkgs.lib.genAttrs [
      "aarch64-linux"
      "x86_64-linux"
    ];
    pkgs = genSystems (system: import nixpkgs {inherit system;});
  in {
    packages = genSystems (system: rec {
      default = pkgs.${system}.callPackage ./nix {inherit version;};
      ags = default;
      agsWithTypes = default; # for backwards compatibility
      agsNoTypes = pkgs.${system}.callPackage ./nix {
        inherit version;
        buildTypes = false;
      };
    });

    homeManagerModules.default = import ./nix/hm-module.nix self;
  };
}
