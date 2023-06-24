desktop_file = i18n.merge_file(
        input: 'com.github.Aylur.ags.desktop.in',
       output: 'com.github.Aylur.ags.desktop',
         type: 'desktop',
       po_dir: '../po',
      install: true,
  install_dir: join_paths(get_option('datadir'), 'applications')
)

desktop_utils = find_program('desktop-file-validate', required: false)
if desktop_utils.found()
  test('Validate desktop file', desktop_utils, args: [desktop_file])
endif

appstream_file = i18n.merge_file(
        input: 'com.github.Aylur.ags.metainfo.xml.in',
       output: 'com.github.Aylur.ags.metainfo.xml',
       po_dir: '../po',
      install: true,
  install_dir: join_paths(get_option('datadir'), 'metainfo')
)

appstream_util = find_program('appstream-util', required: false)
if appstream_util.found()
  test('Validate appstream file', appstream_util, args: ['validate', '--nonet', appstream_file])
endif

gsettings_schema = 'com.github.Aylur.ags.gschema.xml'

local_schemas = configure_file(
  copy: true,
  input: gsettings_schema,
  output: gsettings_schema
)

install_data(gsettings_schema,
  install_dir: join_paths(get_option('datadir'), 'glib-2.0/schemas')
)

compile_schemas = find_program('glib-compile-schemas', required: false)

compile_local_schemas = custom_target(
  'compile_local_schemas',
  input: local_schemas,
  output: 'gschemas.compiled',
  command: [compile_schemas, meson.current_build_dir()]
)

if compile_schemas.found()
  test('Validate schema file',
       compile_schemas,
       args: ['--strict', '--dry-run', meson.current_source_dir()])
endif

data_res = gnome.compile_resources(
  'com.github.Aylur.ags.data',
  'com.github.Aylur.ags.data.gresource.xml',
  gresource_bundle: true,
  install: true,
  install_dir: pkgdatadir,
)

subdir('icons')
