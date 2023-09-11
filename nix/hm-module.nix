self: {
  config,
  pkgs,
  lib,
  ...
}: let
  cfg = config.programs.ags;
  defaultAgsPackage = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
in {
  meta.maintainers = [lib.maintainers.Jappie3];

  options.programs.ags = with lib; {
    enable = mkEnableOption "ags";

    package = mkOption {
      type = with types; nullOr package;
      default = defaultAgsPackage;
      defaultText = literalExpression "ags.packages.${pkgs.stdenv.hostPlatform.system}.default";
      description = mkDoc ''
        The Ags package to use. Defaults to the one provided by the flake.
      '';
    };

    configDir = mkOption {
      type = types.path;
      example = literalExpression "./ags-config";
      description = mkDoc ''
        The directory to symlink to {file}`$XDG_CONFIG_HOME/ags`.
      '';
    };
  };

  config = lib.mkIf cfg.enable {
    home.packages = lib.optional (cfg.package != null) cfg.package;
    xdg.configFile."ags".source = cfg.configDir;
  };
}
