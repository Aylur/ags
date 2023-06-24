# typescript
tsc = find_program('tsc', required: true)
tsc_out = meson.project_build_root() / 'tsc-out'
typescript = custom_target(
  'typescript-compile',
  input: files( 'main.ts' ),
  build_by_default: true,
  build_always_stale: true,
  command: [ tsc, '--outDir', tsc_out ],
  output: ['tsc-output'],
)

# gresource
src_res = import('gnome').compile_resources(
  APP + '.src',
  APP + '.src.gresource.xml',
  dependencies: typescript,
  source_dir: tsc_out,
  gresource_bundle: true,
  install: true,
  install_dir : get_option('datadir') / APP
)

# launcher binary
app_launcher = configure_file(
  input : APP + '.js.in',
  output : APP,
  configuration: {
    'GJS': find_program('gjs').full_path(),
    'GVC_GIR': get_option('prefix') / get_option('libdir') / APP,
    'PACKAGE_NAME': APP,
    'PACKAGE_VERSION': meson.project_version(),
    'PREFIX': get_option('prefix'),
    'LIBDIR': get_option('prefix') / get_option('libdir'),
    'RESOURCE_PATH': '/com/github/Aylur/' + APP,
  },
  install: true,
  install_dir: get_option('bindir'),
  install_mode: 'rwxr-xr-x'
)
