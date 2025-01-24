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
    systems = ["x86_64-linux" "aarch64-linux"];
    forAllSystems = nixpkgs.lib.genAttrs systems;
  in {
    lib.bundle = import ./nix/bundle.nix {inherit self;};

    packages = forAllSystems (
      system: let
        inherit (astal.packages.${system}) astal3 astal4 io gjs;

        pkgs = nixpkgs.legacyPackages.${system};
        astal-io = io;
        astal-gjs = "${gjs}/share/astal/gjs";

        agsPackages = rec {
          default = ags;
          ags = pkgs.callPackage ./nix/default.nix {
            inherit astal3 astal4 astal-io astal-gjs;
            wrap = import ./nix/wrap.nix { inherit pkgs ags; };
          };
          agsFull = ags.wrap {
            extraPackages = builtins.attrValues (
              builtins.removeAttrs astal.packages.${system} ["docs"]
            );
          };
        };
      in
        astal.packages.${system} // agsPackages
    );

    templates.default = {
      path = ./nix/template;
      description = "Example flake.nix that shows how to package a project.";
      welcomeText = ''
        # Getting Started
        - run `nix develop` to enter the development environment
        - run `ags init -d . -f` to setup an initial ags project
        - run `ags run .`   to run the project
      '';
    };

    homeManagerModules = {
      default = self.homeManagerModules.ags;
      ags = import ./nix/hm-module.nix self;
    };

    devShells = forAllSystems (system: let
      pkgs = nixpkgs.legacyPackages.${system};
    in {
      default = pkgs.mkShell {
        packages = with pkgs; [
          markdownlint-cli2
          marksman
          vtsls
          vscode-langservers-extracted
          go
          gopls
          gotools
          go-tools
        ];
      };
    });
  };
}
