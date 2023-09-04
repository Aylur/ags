{
  description = "A customizable and extensible shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { nixpkgs, self }:
  let
    genSystems = nixpkgs.lib.genAttrs [
      "aarch64-linux"
      "x86_64-linux"
    ];
    pkgs = genSystems (system: import nixpkgs { inherit system; });
  in 
  {
    packages = genSystems (system: {
      default = pkgs.${system}.callPackage ./nix/ags.nix {
        gjs = pkgs.${system}.callPackage ./nix/gjs.nix { };
      };
    });
  };
}
