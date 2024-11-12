# Usage on NixOS

The recommended way is to use the home-manager module.

Example content of a `flake.nix` file that contains your `homeConfigurations`.
:::code-group

```nix [<i class="devicon-nixos-plain"></i> flake.nix]
{
  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs/nixos-unstable";
    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    # add ags https://github.com/Aylur/ags/pull/504
    ags.url = "github:aylur/ags/v2";
  };

  outputs = { home-manager, nixpkgs, ... }@inputs:
  let
    system = "x86_64-linux";
  in
  {
    homeConfigurations."${username}" = home-manager.lib.homeManagerConfiguration {
      pkgs = import nixpkgs { inherit system; };

      # pass inputs as specialArgs
      extraSpecialArgs = { inherit inputs; };

      # import your home.nix
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
    configDir = ../ags;

    # additional packages to add to gjs's runtime
    extraPackages = with pkgs; [
      inputs.ags.packages.${pkgs.system}.battery
      fzf
    ];
  };
}
```

:::

AGS by default only includes the core `astal3`, `astal4` and `astal-io` libraries.
If you want to include any other [library](https://aylur.github.io/astal/guide/libraries/references#astal-libraries) you have to add them to `extraPackages`.
You can also add binaries which will be added to the gjs runtime.

:::warning
The `configDir` option symlinks the given path to `~/.config/ags`.
If you already have your source code there leave it as `null`.
:::

The AGS flake does not expose the `astal` cli to the home environment, you have to do that yourself if you want:

:::code-group

```nix [<i class="devicon-nixos-plain"></i> home.nix]
home.packages = [ inputs.ags.packages.${pkgs.system}.io ];
```

```sh [<i class="devicon-bash-plain"></i> sh]
astal --help
```

:::

Same applies to the `extraPackages` option, it does not expose the passed packages to the home environment.
To make astal cli tools available to home environment, you have to add them yourself:

:::code-group

```nix [<i class="devicon-nixos-plain"></i> home.nix]
home.packages = [ inputs.ags.packages.${pkgs.system}.notifd ];
```

```sh [<i class="devicon-bash-plain"></i> sh]
astal-notifd --help
```

:::
