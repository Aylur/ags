{
  description = "A customizable and extensible shell for Hyprland";
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    dongsu8142-nur = {
      url = "github:dongsu8142/nur";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = inputs@{
    self,
    nixpkgs,
    ...
  }: let 
    lib = nixpkgs.lib;
    genSystems = lib.genAttrs [
      "aarch64-linux"
      "x86_64-linux"
    ];
    pkgsFor = genSystems (system:
      import nixpkgs {
        inherit system;
      }
    );
  in {
    packages = genSystems (system: {
      default = pkgsFor.${system}.callPackage ./nix/default.nix { inherit inputs; };
    });
  };
}
