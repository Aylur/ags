{pkgs, ags}: { extraPackages ? [], allowRewrap ? false }:

let
  inherit (pkgs.lib) makeBinPath unique;

  wrapped =
  if extraPackages == []
  then ags
  else pkgs.stdenv.mkDerivation {
    name = "ags-wrapped";
    dontUnpack = true;

    nativeBuildInputs = with pkgs; [wrapGAppsHook gobject-introspection];
    buildInputs = with pkgs; [bash glib] ++ extraPackages;

    installPhase = ''
      mkdir $out/
      ln -s ${ags}/* $out

      # $out/bin must be recreated manually so wrapGAppsHook can work there
      rm $out/bin
      mkdir $out/bin
      ln -s ${ags}/bin/ags $out/bin/
    '';

    preFixup = ''
      gappsWrapperArgs+=(
        --prefix PATH : "${makeBinPath extraPackages}"
      )
    '';

    passthru.wasWrapped = true;
    meta.mainProgram = "ags";
  };

in

if ags.wasWrapped or false
then
  if allowRewrap
  then wrapped
  else
    if extraPackages == []
    then ags
    else ags.override (old: { extraPackages = unique (old.extraPackages ++ extraPackages); })
else wrapped
