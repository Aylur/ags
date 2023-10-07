{
  description = "A customizable and extensible shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { nixpkgs, self }: let
    genSystems = nixpkgs.lib.genAttrs [
      "aarch64-linux"
      "x86_64-linux"
    ];
    pkgs = genSystems (system: import nixpkgs {
      inherit system;
    });
  in {
    packages = genSystems (system: {
      default = pkgs.${system}.callPackage ./nix {};
    });

    homeManagerModules.default = import ./nix/hm-module.nix self;

    devShell = genSystems (system: pkgs.${system}.mkShell {
      nativeBuildInputs = with pkgs.${system}; [
        # typegen
        gobject-introspection.dev
        gtk3.dev
        gnome.gnome-bluetooth.dev
        libdbusmenu-gtk3
        networkmanager.dev
      ];

      packages = with pkgs.${system}; [
        # nodeJS
        nodejs
        nodePackages.npm
	nodePackages.typescript-language-server

        # Nix
        alejandra
        nil
      ];
    });
  };
}
