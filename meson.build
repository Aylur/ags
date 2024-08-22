project(
  'ags',
  'c',
  version: run_command('cat', join_paths(meson.project_source_root(), 'version')).stdout().strip(),
  meson_version: '>= 0.62.0',
)

astal = dependency('astal-0.1')
node = find_program('node')
npx = find_program('npx')
gjs = find_program('gjs')
ags_bundle = find_program('ags-bundle')
datadirs = run_command('bash', '-c', 'echo $XDG_DATA_DIRS').stdout().strip()

pkgdatadir = get_option('prefix') / get_option('datadir') / 'ags'

custom_target(
  'ags',
  output: ['ags'],
  command: [node.full_path(), files('esbuild.mjs')],
  build_by_default: true,
  install: true,
  install_dir: get_option('prefix') / get_option('bindir'),
  env: {
    'AGS_INFILE': meson.project_source_root() + '/src/ags.ts',
    'AGS_OUTFILE': meson.project_build_root() + '/ags',
    'AGS_BUNDLER': ags_bundle.full_path(),
    'ASTAL_GJS': astal.get_variable('gjs'),
    'GJS': gjs.full_path(),
    'NPX': npx.full_path(),
    'PKGDATADIR': pkgdatadir,
    'VERSION': meson.project_version(),
    'XDG_DATA_DIRS': datadirs,
  },
)

configure_file(
  input: 'data/tsconfig.json',
  output: 'tsconfig.json',
  configuration: {
    'ASTAL_GJS': astal.get_variable('gjs'),
  },
  install: true,
  install_dir: pkgdatadir,
)

install_data(
  'data/env.d.ts',
  install_dir: pkgdatadir,
)
