# Usage on NixOS

Initialize a directory using the template.

```sh
nix flake init --template github:aylur/ags
```

## Bundle and DevShell

To build a derivation you can use the `ags bundle` command.

:::code-group

```nix [<i class="devicon-nixos-plain"></i> flake.nix]
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";

    astal = {
      url = "github:aylur/astal";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    ags = {
      url = "github:aylur/ags";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.astal.follows = "astal";
    };
  };

  outputs = { self, nixpkgs, ags, astal }: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
  in {
    packages.${system}.default = pkgs.stdenv.mkDerivation { # [!code focus:31]
      pname = "my-shell";

      src = ./.;

      nativeBuildInputs = with pkgs; [
        wrapGAppsHook
        gobject-introspection
        ags.packages.${system}.default
      ];

      buildInputs = [
        pkgs.glib
        pkgs.gjs
        astal.io
        astal.astal4
        # packages like astal.battery or pkgs.libsoup_4
      ];

      installPhase = ''
        ags bundle app.ts $out/bin/my-shell
      '';

      preFixup = ''
        gappsWrapperArgs+=(
          --prefix PATH : ${pkgs.lib.makeBinPath ([
            # runtime executables
          ])}
        )
      '';
    };
  };
}
```

:::

While working on the project, it would make sense to use the `ags` cli instead
of building it everytime with `nix`.

You could enter a shell with `agsFull` package which exposes AGS + every
[Astal library](https://aylur.github.io/astal/guide/libraries/references#astal-libraries).

```sh
nix shell github:aylur/ags#agsFull
```

Or define a `devShell` and cherry pick packages.

:::code-group

```nix [<i class="devicon-nixos-plain"></i> flake.nix]
{
  outputs = { self, nixpkgs, ags }: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
  in {
    devShells.${system}.default = pkgs.mkShell {
      buildInputs = [
        (ags.packages.${system}.default.override { # [!code focus:5]
          extraPackages = [
            # cherry pick packages
          ];
        })
      ];
    };
  };
}
```

## Using home-manager

If you prefer the workflow of "configuring a program" instead of "using a
library", you can use the home-manager module.

:::

Example content of `flake.nix`

:::code-group

```nix [<i class="devicon-nixos-plain"></i> flake.nix]
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";

    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    astal.url = "github:aylur/astal";

    ags.url = "github:aylur/ags"; # [!code focus]
  };

  outputs = { home-manager, nixpkgs, ... }@inputs:
  let
    system = "x86_64-linux";
  in
  {
    homeConfigurations."${username}" = home-manager.lib.homeManagerConfiguration {
      pkgs = import nixpkgs { inherit system; };

      # pass inputs as specialArgs # [!code focus:2]
      extraSpecialArgs = { inherit inputs; };

      # import your home.nix # [!code focus:2]
      modules = [ ./home-manager/home.nix ];
    };
  };
}
```

:::

Example content of `home.nix` file

:::code-group

```nix [<i class="devicon-nixos-plain"></i> home.nix]
{ inputs, pkgs, ... }:
{
  # add the home manager module
  imports = [ inputs.ags.homeManagerModules.default ];

  programs.ags = {
    enable = true;

    # symlink to ~/.config/ags
    configDir = ../ags;

    # additional packages and executables to add to gjs's runtime
    extraPackages = with pkgs; [
      inputs.astal.packages.${pkgs.system}.battery
      fzf
    ];
  };
}
```

:::

The module only includes the core `astal3`, `astal4` and `astal-io` libraries.
If you want to include any other
[library](https://aylur.github.io/astal/guide/libraries/references#astal-libraries)
you have to add them to `extraPackages`. You can also add binaries which will be
added to the gjs runtime.

> [!WARNING]
>
> The `configDir` option symlinks the given path to `~/.config/ags`. If you
> already have your source code there leave it as `null`.

## Using Astal CLI tools

The home-manager module does not expose the `astal` CLI to the home environment,
you have to do that yourself if you want:

:::code-group

```nix [<i class="devicon-nixos-plain"></i> home.nix]
home.packages = [ inputs.astal.packages.${pkgs.system}.io ];
```

```sh [<i class="devicon-bash-plain"></i> sh]
astal --help
```

:::

Same applies to the `extraPackages` option, it does not expose the passed
packages to the home environment. To make astal cli tools available to home
environment, you have to add them yourself:

:::code-group

```nix [<i class="devicon-nixos-plain"></i> home.nix]
home.packages = [ inputs.astal.packages.${pkgs.system}.notifd ];
```

```sh [<i class="devicon-bash-plain"></i> sh]
astal-notifd --help
```

:::
