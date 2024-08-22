{
  pkgs,
  version,
}:
pkgs.buildGoModule {
  inherit version;
  pname = "ags-bundle";
  src = ./.;
  vendorHash = "sha256-iELy3B6mCTDbAlv+KvrLrKZD21tflGmY20UTiifZbcQ=";
}
