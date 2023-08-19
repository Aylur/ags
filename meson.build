project('ags',
          version: '1.0.0',
    meson_version: '>= 0.62.0',
    	  license: ['GPL-3.0-or-later'],
  default_options: [ 'warning_level=2', 'werror=false', ],
)

APP = meson.project_name()

dependency('gobject-introspection-1.0', version: '>= 1.49.1')
dependency('gio-2.0', version: '>= 2.56.0')
dependency('gjs-1.0', version: '>= 1.73.1')
dependency('gtk+-3.0', version: '>= 3.0')

subproject('gvc',
  default_options: [
    'package_name=' + APP,
    'pkgdatadir=' + get_option('datadir') / APP,
    'pkglibdir=' + get_option('libdir') / APP,
    'static=false',
    'introspection=true',
    'alsa=false'
  ]
)

subdir('src')
