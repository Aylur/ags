{
  description = "A customizable and extensible shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";

    # «https://github.com/nix-systems/nix-systems»
    systems.url = "github:nix-systems/default-linux";
  };

  outputs = {
    nixpkgs,
    self,
    systems,
  }: let
    version = builtins.replaceStrings ["\n"] [""] (builtins.readFile ./version);
    genSystems = nixpkgs.lib.genAttrs (import systems);
    pkgs = genSystems (system: import nixpkgs {inherit system;});
  in {
    packages = genSystems (system: let
      inherit (pkgs.${system}) callPackage;
    in {
      default = callPackage ./nix {inherit version;};
      ags = self.packages.${system}.default;
      agsWithTypes = self.packages.${system}.default; # for backwards compatibility
      agsNoTypes = callPackage ./nix {
        inherit version;
        buildTypes = false;
      };
    });

    homeManagerModules = {
      default = self.homeManagerModules.ags;
      ags = import ./nix/hm-module.nix self;
    };
  };
}
