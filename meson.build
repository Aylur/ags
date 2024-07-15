project(
  'ags',
  'c',
  version: run_command('cat', join_paths(meson.project_source_root(), 'version')).stdout().strip(),
  meson_version: '>= 0.62.0',
  license: ['GPL-3.0-or-later'],
  default_options: [
    'warning_level=2',
    'werror=false',
  ],
)

astal = dependency('astal-0.1')
esbuild = find_program('esbuild')
npx = find_program('npx')
gjs = find_program('gjs')
datadirs = run_command('bash', '-c', 'echo $XDG_DATA_DIRS').stdout().strip()

configure_file(
  input: 'ags.js',
  output: 'ags',
  configuration: {
    'ASTAL_GJS': astal.get_variable('gjs'),
    'GJS': gjs.full_path(),
    'ESBUILD': esbuild.full_path(),
    'NPX': npx.full_path(),
    'VERSION': meson.project_version(),
    'XDG_DATA_DIRS': datadirs,
  },
  install: true,
  install_dir: get_option('prefix') / get_option('bindir'),
)
