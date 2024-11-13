# Generating TypeScript types

Generating types and a tsconfig.json can be done with the `ags types` command.

:::details
Uses [gjsify/ts-for-gir](https://github.com/gjsify/ts-for-gir) under the hood.
:::

```sh
ags types --help

Generate TypeScript types

Usage:
  ags types [pattern] [flags]

Examples:
  ags types Astal* --ignore Gtk3 --ignore Astal3

Flags:
  -d, --directory string     target directory (default "~/.config/ags")
  -h, --help                 help for types
  -i, --ignore stringArray   modules that should be ignored
      --tsconfig             update tsconfig.json
```

You will be using this command when adding libraries already into development
or when cloning existing projects like [astal/examples/js](https://github.com/Aylur/astal/tree/main/examples/js)
in which case you will be using the `--tsconfig` flag.

> [!NOTE]
> `ags init` will invoke this command with the default `*` pattern
