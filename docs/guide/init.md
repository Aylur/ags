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
├── .gitignore
├── @girs/              # generated types
├── widget/
│   └── Bar.tsx
├── app.ts              # entry proint
├── env.d.ts            # additional types
├── style.scss
└── tsconfig.json       # needed by LSPs
```

The `@girs` directory contains the generated types, which are
created when running the `init` command or the `types` command.

Assuming this directory will be tracked with git,
it generates a `.gitignore` file which is set to ignore `@girs` and `node_modules`.
Initially `node_modules` doesn't exist, but if you decide to install any `npm`
package it is not needed to track them with git. You can also add `tsconfig.json`
and `env.d.ts` to this list, as they are only used for developing and can be
regenerated with the `types` command. Only track `tsconfig.json` if you add
anything additional to `compilerOptions.paths`.

> [!NOTE]
> Since the runtime is `gjs`, very few packages will run from `npm`.

The `env.d.ts` will tell the LSP that `.css`, `.scss` and `.blp` files can be
imported and will be inlined as a string. It also tells it that imports
prefixed with `inline:` will be inlined as well as that a global `SRC` variable
is available.

The `tsconfig.json` file tells information to the LSP so that
intellisense can do its thing and provide great DX.

`app.ts` is the entry point of the project which usually contains only
an `App.start` call where you define [main](https://aylur.github.io/astal/guide/typescript/cli-app#entry-point) and [requestHandler](https://aylur.github.io/astal/guide/typescript/cli-app#messaging-from-cli),
but can contain any other code.

> [!NOTE]
> You could also name the entry file `app.tsx` and write any JSX there.

> [!TIP]
> You are not forced to use TypeScript. Adding `"allowJs": true`
> in `tsconfig.json` and optionally `"checkJs": true` will allow
> JavaScript, although it is very much recommended to TypeScript.

You are not forced into a project structure. You can put
`style.scss` and `widget/Bar.ts` anywhere you like, only the entry file matters.

## Running projects

`tsconfig.json`, `env.d.ts` and `@girs` are only significant for the LSP,
they are not needed to run the project.

:::tip
You can also use `ags run` as a shebang line for simple scripts.
See an [simple dialog example](./example.md)
:::
