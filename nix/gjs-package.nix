{
  stdenv,
  gnim,
  version,
  runCommand,
}:
stdenv.mkDerivation {
  pname = "ags-js-lib";
  inherit version;

  # FIXME: how do I pull submodules without "?submodules=1"?
  src = runCommand "ags" {} ''
    mkdir -p $out/lib/gnim
    cp -r ${../lib}/* $out/lib
    cp -r ${gnim}/* $out/lib/gnim
  '';

  installPhase = ''
    jsdir="$out/share/ags/js"
    mkdir -p $jsdir
    cp lib/package.json $jsdir
    cp -r lib/src $jsdir

    mkdir -p $jsdir/gnim
    cp -r lib/gnim/src $jsdir/gnim
  '';
}
