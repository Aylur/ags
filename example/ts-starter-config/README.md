# TypeScript Starter Config

Dependency: `bun`

```bash
mkdir -p ~/.config/ags
git clone https://github.com/Aylur/ags.git /tmp/ags
cp -r /tmp/ags/example/ts-starter-config/* ~/.config/ags
```

optionally setup types

```bash
ags --init -c ~/.config/ags/config.js
```

running

```bash
ags -c ~/.config/ags/config.js &
```
