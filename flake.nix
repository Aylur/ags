{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    astal.url = "github:astal-sh/libastal";
    astal-apps.url = "github:astal-sh/apps";
    astal-auth.url = "github:astal-sh/auth";
    astal-battery.url = "github:astal-sh/battery";
    astal-bluetooth.url = "github:astal-sh/bluetooth";
    astal-hyprland.url = "github:astal-sh/hyprland";
    astal-mpris.url = "github:astal-sh/mpris";
    astal-notifd.url = "github:astal-sh/notifd";
    astal-powerprofiles.url = "github:astal-sh/powerprofiles";
    astal-river.url = "github:astal-sh/river";
    astal-tray.url = "github:astal-sh/tray";
  };

  outputs = {
    self,
    nixpkgs,
    astal,
    ...
  } @ inputs: let
    system = "x86_64-linux";
    pkgs = import nixpkgs {inherit system;};

    nativeBuildInputs = with pkgs; [
      wrapGAppsHook
      gobject-introspection
      meson
      ninja
      pkg-config
    ];

    buildInputs = with pkgs; [
      gjs
      nodejs
      esbuild
      gtk-layer-shell
      astal.packages.${system}.default
    ];
  in {
    packages.${system} = {
      default = pkgs.stdenv.mkDerivation {
        inherit nativeBuildInputs buildInputs;
        pname = "ags";
        version = "2.0.0";
        src = ./.;
      };

      astal-apps = inputs.astal-apps.packages.${system}.default;
      astal-auth = inputs.astal-auth.packages.${system}.default;
      astal-battery = inputs.astal-battery.packages.${system}.default;
      astal-bluetooth = inputs.astal-bluetooth.packages.${system}.default;
      astal-hyprland = inputs.astal-hyprland.packages.${system}.default;
      astal-mpris = inputs.astal-mpris.packages.${system}.default;
      astal-notifd = inputs.astal-notifd.packages.${system}.default;
      astal-powerprofiles = inputs.astal-powerprofiles.packages.${system}.default;
      astal-river = inputs.astal-river.packages.${system}.default;
      astal-tray = inputs.astal-tray.packages.${system}.default;
    };

    devShells.${system}.default = pkgs.mkShell {
      inherit nativeBuildInputs buildInputs;
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
        (mkIf (cfg.package != null) (let
          pkg = cfg.package.override {
            extraPackages = cfg.extraPackages;
            buildTypes = true;
          };
        in {
          programs.ags.finalPackage = pkg;
          home.packages = [pkg];
        }))
      ]);
    };
  };
}
