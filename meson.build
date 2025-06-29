project('ags')

pkgdatadir = get_option('prefix') / get_option('datadir') / meson.project_name()
bindir = get_option('prefix') / get_option('bindir')

install_data(
  'lib/package.json',
  install_dir: pkgdatadir / 'js',
)

install_subdir(
  'lib/src',
  install_dir: pkgdatadir / 'js',
)

install_subdir(
  'lib/gnim/src',
  install_dir: pkgdatadir / 'js' / 'gnim',
)

custom_target(
  'cli',
  command: [
    find_program('go'),
    'build',
    '-C', meson.project_source_root() / 'cli',
    '-o', meson.project_build_root() / 'ags',
    '-ldflags',
    '-X main.gtk4LayerShell='
    + dependency('gtk4-layer-shell-0').get_variable('libdir') / 'libgtk4-layer-shell.so'
    + ' -X main.agsJsPackage='
    + pkgdatadir / 'js'
    + ' -X main.gjs='
    + find_program('gjs').full_path()
    + ' -X main.bash='
    + find_program('bash').full_path(),
  ],
  output: 'ags',
  install: true,
  install_dir: bindir,
)
