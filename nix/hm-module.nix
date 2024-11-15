self: {
  config,
  pkgs,
  lib,
  ...
}: let
  inherit (lib) mkMerge types;
  inherit (lib.modules) mkIf;
  inherit (lib.options) mkOption mkEnableOption literalExpression;

  cfg = config.programs.ags;
  default = {
    agsPackage = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
    gtk3Package = self.packages.${pkgs.stdenv.hostPlatform.system}.astal3;
    ioPackage = self.packages.${pkgs.stdenv.hostPlatform.system}.io;
    gjsPackage = self.packages.${pkgs.stdenv.hostPlatform.system}.gjs;
  };
in {
  options.programs.ags = {
    enable = mkEnableOption "ags";

    package = mkOption {
      type = types.package;
      default = default.agsPackage;
      defaultText = literalExpression "inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.default";
      description = ''
        The Ags package to use.

        By default, this option will use the `packages.default` as exposed by this flake.
      '';
    };

    astal.gtk3Package = mkOption {
      type = types.package;
      default = default.gtk3Package;
      defaultText = literalExpression "inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.astal3";
      description = ''
        The GTK3 Astal package to use.

        By default, this option will use the `packages.astal3` as exposed by this flake.
      '';
    };

    astal.ioPackage = mkOption {
      type = types.package;
      default = default.ioPackage;
      defaultText = literalExpression "inputs.ags.packages.${pkgs.stdenv.hostPlatform.system}.io";
      description = ''
        The core Astal package to use.

        By default, this option will use the `packages.io` as exposed by this flake.
      '';
    };

    astal.gjsPackage = mkOption {
      type = types.package;
      default = default.gjsPackage;
      description = ''
        The Astal Gjs package to use.

        By default, this option will use the `packages.gjs` as exposed by this flake.
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

    systemd.enable = mkOption {
      type = types.bool;
      default = false;
      example = true;
      description = ''
        Enable systemd integration.
      '';
    };
  };

  config = mkIf cfg.enable (mkMerge [
    (mkIf (cfg.configDir != null) {
      xdg.configFile."ags".source = cfg.configDir;
    })
    (let
      pkg = cfg.package.override {
        extraPackages = cfg.extraPackages;
        astal3 = cfg.astal.gtk3Package;
        astal-io = cfg.astal.ioPackage;
        astal-gjs = "${config.home.homeDirectory}/.local/share/ags";
      };
    in {
      programs.ags.finalPackage = pkg;
      home.packages = [pkg];
      home.file.".local/share/ags".source = "${cfg.astal.gjsPackage}/share/astal/gjs";
    })
    (mkIf cfg.systemd.enable {
      systemd.user.services.ags = {
        Unit = {
          Description = "AGS - Tool for scaffolding Astal+TypeScript projects.";
          Documentation = "https://github.com/Aylur/ags";
          PartOf = ["graphical-session.target"];
          After = ["graphical-session-pre.target"];
        };

        Service = {
          ExecStart = "${cfg.finalPackage}/bin/ags run";
          Restart = "on-failure";
          KillMode = "mixed";
        };

        Install = {
          WantedBy = ["graphical-session.target"];
        };
      };
    })
  ]);
}
