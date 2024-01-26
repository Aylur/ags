self: {
  config,
  pkgs,
  lib,
  ...
}: let
  inherit (lib) mkMerge types;
  inherit (lib.modules) mkIf;
  inherit (lib.options) mkOption mkEnableOption literalExpression;

  defaultAgsPackage = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
  cfg = config.programs.ags;
in {
  options.programs.ags = {
    enable = mkEnableOption "ags";

    package = mkOption {
      type = with types; nullOr package;
      default = defaultAgsPackage;
      defaultText = literalExpression "inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.default";
      description = ''
        The Ags package to use.

        By default, this option will use the `packages.default` as exposed by this flake.
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
    (mkIf (cfg.package != null) (let
      path = "/share/com.github.Aylur.ags/types";
      pkg = cfg.package.override {
        extraPackages = cfg.extraPackages;
        buildTypes = true;
      };
    in {
      home.packages = [pkg];
      home.file.".local/${path}".source = "${pkg}/${path}";
    }))
  ]);
}
