project('ags')

pkgdatadir = get_option('prefix') / get_option('datadir') / meson.project_name()
bindir = get_option('prefix') / get_option('bindir')

layer_shell = dependency('gtk4-layer-shell-0', required: false)
go = find_program('go', required: false)

install_data(
  'lib/package.json',
  install_dir: pkgdatadir / 'js',
)

install_subdir(
  'lib/src',
  install_dir: pkgdatadir / 'js',
)

install_subdir(
  'lib/gjsx/src',
  install_dir: pkgdatadir / 'js' / 'gjsx',
)

# without introducing meson_options when these two
# are not found we assume its from nix so we silently skip
if layer_shell.found() and go.found()
  custom_target(
    'cli',
    command: [
      go,
      'build',
      '-C', meson.project_source_root() / 'cli',
      '-o', meson.project_build_root() / 'ags',
      '-ldflags',
      '-X main.gtk4LayerShell='
      + layer_shell.get_variable('libdir') / 'libgtk4-layer-shell.so'
      + ' -X main.gjsPackage='
      + pkgdatadir / 'gjs',
    ],
    output: 'ags',
    install: true,
    install_dir: bindir,
  )
endif
