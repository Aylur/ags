project('gutils', 'c')

pkglibdir = get_option('pkglibdir')
pkgdatadir = get_option('pkgdatadir')

cc = meson.get_compiler('c')

wayland = import('unstable-wayland')

gir_sources = [
  'pam.c',
  'pam.h',
  'river.c',
  'river.h',
  'rivermonitor.c',
  'rivermonitor.h',
]

other_sources = [
  wayland.scan_xml('protocol/river-control-unstable-v1.xml'),
  wayland.scan_xml('protocol/river-status-unstable-v1.xml'),
]

deps = [
  dependency('gobject-2.0'),
  dependency('gio-2.0'),
  dependency('gdk-wayland-3.0'),
  dependency('pam'),
  dependency('wayland-client'),
]

girlib = shared_library(
  'gutils',
  sources: gir_sources + other_sources,
  dependencies: deps,
  install: true
)

gnome = import('gnome')
gnome.generate_gir(
  girlib,
  sources: gir_sources,
  nsversion: '1.0',
  namespace: 'GUtils',
  symbol_prefix: 'gutils',
  identifier_prefix: 'GUtils',
  includes: ['GObject-2.0', 'Gio-2.0'],
  install_dir_gir: pkgdatadir,
  install_dir_typelib: pkglibdir,
  install: true
)

install_data(
  'ags',
  install_dir: get_option('sysconfdir') / 'pam.d'
)
