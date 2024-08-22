{
  outputs = {
    self,
    nixpkgs,
    astal,
    ...
  } @ inputs: let
    system = "x86_64-linux";
    pkgs = import nixpkgs {inherit system;};
    version = builtins.replaceStrings ["\n"] [""] (builtins.readFile ./version);

    nativeBuildInputs = with pkgs; [
      wrapGAppsHook
      gobject-introspection
      meson
      ninja
      pkg-config
      go
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
        inherit nativeBuildInputs version;
        buildInputs = buildInputs ++ [self.packages.${system}.ags-bundle];
        pname = "ags";
        src = pkgs.buildNpmPackage {
          name = "ags";
          src = ./.;
          npmDepsHash = "sha256-zo2GJjQC0aEwXZFhoPEBAtMvHF87zddllgZBMyz/XhE=";
          installPhase = ''
            mkdir $out
            cp * -r $out
          '';
        };
      };

      ags-bundle = import ./ags-bundle {
        inherit pkgs version;
      };

      apps = inputs.apps.packages.${system}.default;
      auth = inputs.auth.packages.${system}.default;
      battery = inputs.battery.packages.${system}.default;
      bluetooth = inputs.bluetooth.packages.${system}.default;
      hyprland = inputs.hyprland.packages.${system}.default;
      mpris = inputs.mpris.packages.${system}.default;
      notifd = inputs.notifd.packages.${system}.default;
      powerprofiles = inputs.powerprofiles.packages.${system}.default;
      river = inputs.river.packages.${system}.default;
      tray = inputs.tray.packages.${system}.default;
      wireplumber = inputs.wireplumber.packages.${system}.default;
    };

    devShells.${system} = {
      default = pkgs.mkShell {
        inherit nativeBuildInputs buildInputs;
      };
      ags = pkgs.mkShell {
        inherit nativeBuildInputs;
        buildInputs =
          buildInputs
          ++ (builtins.attrValues self.packages.${system})
          ++ [pkgs.libdbusmenu-gtk3];
      };
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

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    astal = {
      url = "github:astal-sh/libastal";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    apps = {
      url = "github:astal-sh/apps";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    auth = {
      url = "github:astal-sh/auth";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    battery = {
      url = "github:astal-sh/battery";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    bluetooth = {
      url = "github:astal-sh/bluetooth";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    hyprland = {
      url = "github:astal-sh/hyprland";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    mpris = {
      url = "github:astal-sh/mpris";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    notifd = {
      url = "github:astal-sh/notifd";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    network = {
      url = "github:astal-sh/network";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    powerprofiles = {
      url = "github:astal-sh/powerprofiles";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    river = {
      url = "github:astal-sh/river";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    tray = {
      url = "github:astal-sh/tray";
      inputs.nixpkgs.follows = "nixpkgs";
    };
    wireplumber = {
      url = "github:astal-sh/wireplumber";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };
}
