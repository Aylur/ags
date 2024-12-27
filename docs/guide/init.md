# Setting up a project

You can initalize a project with the `init` command.

```sh
$ ags init --help

Initialize a project directory by setting up files needed by TypeScript,
generating types and setting up a basic bar example

Usage:
  ags init [flags]

Flags:
  -d, --directory string   target directory (default "~/.config/ags")
  -f, --force              override existing files
  -g, --gtk int            gtk version to use (default 3)
  -h, --help               help for init

```

By default it will set it up at `$HOME/.config/ags`,
but you can specify the target directory with the `-d` flag.

It will generate the following files:

```txt
.
├── @girs/
├── node_modules/
│   └── astal
├── widget/
│   └── Bar.tsx
├── app.ts
├── env.d.ts
├── style.scss
├── package.json
└── tsconfig.json
```

The `@girs` directory contains the generated types, which are
created when running the `init` command or the `types` command.

:::details Details on TypeScript.
While `gjs` does not currently support Node.js project structures and its ecosystem
the JavaScript tooling we are using relies on it. The `node_modules` directory
contains the `astal` package, but its purpose is only to provide type information.
The `package.json` is a file describing the project and `tsconfig.json` is a file
containing settings for TypeScript.
:::

> [!WARNING]
> Since the runtime is `gjs`, very few packages will run from `npm`,
since most depends on `node` features.

The `env.d.ts` let's the type checker in your editor know about additional
[features](./bundling) the `ags` bundler provides, for example the ability to inline files.
This can be also be expanded for variables defined with the `--define` flag at bundling.

`app.ts` is the entry point of the project which usually
contains only an `App.start` call where you define [main](https://aylur.github.io/astal/guide/typescript/cli-app#entry-point) and [requestHandler](https://aylur.github.io/astal/guide/typescript/cli-app#messaging-from-cli),
but can contain any other code.

> [!TIP]
> You could also name the entry file `app.tsx` and write any JSX there.

> [!TIP]
> You are not forced to use TypeScript. Adding `"allowJs": true`
> in `tsconfig.json` and optionally `"checkJs": true` will allow
> JavaScript, although it is very much recommended to TypeScript.

## Running projects

`tsconfig.json`, `env.d.ts` and `@girs` are only significant for the LSP,
they are not needed to run the project.

> [!TIP]
> You can also use `ags run` as a shebang line for simple scripts.
> See an [simple dialog example](./example.md).

> [!IMPORTANT]
> When using Gtk4 you have to use `--gtk4` flag for [gtk4-layer-shell](https://github.com/wmww/gtk4-layer-shell/issues/3#issuecomment-1502339477).
