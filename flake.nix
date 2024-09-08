{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    astal.url = "github:aylur/astal";
  };

  outputs = {
    self,
    nixpkgs,
    astal,
  }: let
    system = "x86_64-linux";
    pkgs = import nixpkgs {inherit system;};
  in {
    packages.${system} =
      astal.packages.${system}
      // {
        default = self.packages.${system}.ags;
        ags = pkgs.callPackage ./src {
          astal = astal.packages.${system}.default;
        };
        agsFull = pkgs.callPackage ./src {
          astal = astal.packages.${system}.default;
          extraPackages = builtins.attrValues astal.packages.${system};
        };
      };

    devShells.${system} = {
      default = astal.devShells.${system}.default.overrideAttrs (_: prev: {
        buildInputs = prev.buildInputs ++ [pkgs.go];
      });
    };

    homeManagerModules.default = {
      config,
      pkgs,
      lib,
      ...
    }: let
      inherit (lib) mkMerge types;
      inherit (lib.modules) mkIf;
      inherit (lib.options) mkOption mkEnableOption literalExpression;

      defaultAgsPackage = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
      defaultAstalPackage = self.packages.${pkgs.stdenv.hostPlatform.system}.astal;
      cfg = config.programs.ags;
    in {
      options.programs.ags = {
        enable = mkEnableOption "ags";

        package = mkOption {
          type = types.package;
          default = defaultAgsPackage;
          defaultText = literalExpression "inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.default";
          description = ''
            The Ags package to use.

            By default, this option will use the `packages.default` as exposed by this flake.
          '';
        };

        astalPackage = mkOption {
          type = types.package;
          default = defaultAstalPackage;
          defaultText = literalExpression "inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.astal";
          description = ''
            The Astal package to use when transpiling.

            By default, this option will use the `packages.astal` as exposed by this flake.
          '';
        };

        finalPackage = mkOption {
          type = types.package;
          readOnly = true;
          visible = false;
          description = ''
            Resulting ags package.
          '';
        };

        configDir = mkOption {
          type = with types; nullOr path;
          default = null;
          example = literalExpression "./ags-config";
          description = ''
            The directory to symlink to {file}`$XDG_CONFIG_HOME/ags`.
          '';
        };

        extraPackages = mkOption {
          type = with types; listOf package;
          default = [];
          description = ''
            Additional packages to add to gjs's runtime.
          '';
          example = literalExpression "[ pkgs.libsoup_3 ]";
        };
      };

      config = mkIf cfg.enable (mkMerge [
        (mkIf (cfg.configDir != null) {
          xdg.configFile."ags".source = cfg.configDir;
        })
        (let
          pkg = cfg.package.override {
            extraPackages = cfg.extraPackages;
            astal = cfg.astalPackage;
            astalGjs = "${config.home.homeDirectory}/.local/share/ags";
          };
        in {
          programs.ags.finalPackage = pkg;
          home.packages = [pkg];
          home.file.".local/share/ags".source = "${cfg.astalPackage}/share/astal/gjs";
        })
      ]);
    };
  };
}
