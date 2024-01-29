project('pam', 'c')

pkglibdir = get_option('pkglibdir')
pkgdatadir = get_option('pkgdatadir')

cc = meson.get_compiler('c')

libsources = ['pam.c', 'pam.h']

deps = [
  dependency('gobject-2.0'),
  dependency('gio-2.0'),
  dependency('pam')
]

girlib = shared_library(
  'pam',
  sources: libsources,
  dependencies: deps,
  install: true
)

gnome = import('gnome')
gnome.generate_gir(
  girlib,
  sources: libsources,
  nsversion: '1.0',
  namespace: 'Pam',
  symbol_prefix: 'ags_pam',
  identifier_prefix: 'Pam',
  includes: ['GObject-2.0', 'Gio-2.0'],
  install_dir_gir: pkgdatadir,
  install_dir_typelib: pkglibdir,
  install: true
)

install_data(
  'ags',
  install_dir: get_option('sysconfdir') / 'pam.d'
)
