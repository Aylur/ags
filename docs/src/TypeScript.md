To have auto suggestions and type checking while working on the configuration, you will need to setup a TypeScript LSP in your IDE.

> [!WARNING]
> Bluetooth doesn't have type definitions yet.

Copy the starter config 
```bash
git clone https://github.com/Aylur/ags.git
cp -r ags/example/starter-config ~/.config/ags
```

Setup types
```bash
cd ~/.config/ags
./setup.sh
```

If you don't want the LSP to typecheck your js files unset it in tsconfig.json
```json
"checkJs": false
```