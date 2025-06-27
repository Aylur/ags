{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    astal = {
      url = "github:aylur/astal";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    gnim = {
      url = "github:aylur/gnim";
      flake = false;
    };
  };

  outputs = {
    self,
    nixpkgs,
    astal,
    gnim,
  }: let
    systems = ["x86_64-linux" "aarch64-linux"];
    forAllSystems = nixpkgs.lib.genAttrs systems;
    version = builtins.replaceStrings ["\n"] [""] (builtins.readFile ./cli/version);
  in {
    packages = forAllSystems (
      system: let
        inherit (astal.packages.${system}) astal3 astal4 io;

        pkgs = nixpkgs.legacyPackages.${system};

        agsJsPackage = pkgs.callPackage ./nix/gjs-package.nix {
          inherit gnim version;
        };

        agsPackages = {
          default = self.packages.${system}.ags;
          gjsPackage = agsJsPackage;

          ags = pkgs.callPackage ./nix {
            inherit version astal3 astal4 agsJsPackage;
            astal-io = io;
          };
          agsFull = pkgs.callPackage ./nix {
            inherit version astal3 astal4 agsJsPackage;
            astal-io = io;
            extraPackages =
              builtins.attrValues (
                builtins.removeAttrs astal.packages.${system} ["docs"]
              )
              ++ [pkgs.libadwaita];
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

    devShells = forAllSystems (system:
      import ./nix/devshell.nix {
        inherit self astal;
        pkgs = nixpkgs.legacyPackages.${system};
      });
  };
}
