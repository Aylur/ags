# Astal CLI

AGS provides aliases for the [Astal CLI](https://aylur.github.io/astal/guide/typescript/cli-app).

## [Request](https://aylur.github.io/astal/guide/typescript/cli-app#messaging-from-cli)

```ts
App.start({
    requestHandler(request: string, res: (response: any) => void) {
        if (request == "say hi") {
            res("hi cli")
        }
        res("unknown command")
    },
})
```

:::code-group

```sh [astal]
astal say hi --instance astal
# hi cli
```

```sh [ags]
ags request "say hi" --instance astal
# hi cli
```

:::

## List

:::code-group

```sh [astal]
astal --list
```

```sh [ags]
ags list
```

:::

## [Opening the inspector](https://aylur.github.io/astal/guide/typescript/theming#inspector)

:::code-group

```sh [astal]
astal --inspector --instance astal
```

```sh [ags]
ags inspect --instance astal
```

:::

## [Window toggling](https://aylur.github.io/astal/guide/typescript/cli-app#toggling-windows-by-their-name)

:::code-group

```sh [astal]
astal --toggle-window window-name --instance astal
```

```sh [ags]
ags toggle window-name --instance astal
```

:::

## Quitting App

:::code-group

```sh [astal]
astal --quit --instance astal
```

```sh [ags]
ags quit --instance astal
```

:::
