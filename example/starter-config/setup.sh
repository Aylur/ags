#!/usr/bin/env bash

dir="${1:-$HOME/.config/ags}"

mkdir -p /tmp/ags-config
cd /tmp/ags-config

# clone
echo "cloning ags"
git clone https://github.com/Aylur/ags.git
cd ags
npm i

# generate
echo "generating types..."
tsc -d --declarationDir dts --emitDeclarationOnly

# fix paths
find ./dts -type f | xargs sed -i 's/gi:\/\/Gtk?version=3.0/node_modules\/@girs\/gtk-3.0\/gtk-3.0/g'
find ./dts -type f | xargs sed -i 's/gi:\/\/GObject/node_modules\/@girs\/gobject-2.0\/gobject-2.0/g'
find ./dts -type f | xargs sed -i 's/gi:\/\/Gio/node_modules\/@girs\/gio-2.0\/gio-2.0/g'
find ./dts -type f | xargs sed -i 's/gi:\/\/GLib/node_modules\/@girs\/glib-2.0\/glib-2.0/g'
find ./dts -type f | xargs sed -i 's/gi:\/\/GdkPixbuf/node_modules\/@girs\/gdkpixbuf-2.0\/gdkpixbuf-2.0/g'
find ./dts -type f | xargs sed -i 's/gi:\/\/Gdk/node_modules\/@girs\/gdk-2.0\/gdk-2.0/g'
find ./dts -type f | xargs sed -i 's/gi:\/\/Gvc/node_modules\/@girs\/gvc-1.0\/gvc-1.0/g'
find ./dts -type f | xargs sed -i 's/gi:\/\/NM/node_modules\/@girs\/nm-1.0\/nm-1.0/g'
find ./dts -type f | xargs sed -i 's/gi:\/\/DbusmenuGtk3/node_modules\/@girs\/dbusmenugtk3-0.4\/dbusmenugtk3-0.4/g'

# move
mv dts $dir/types
echo "types moved to $dir/types"

# gen ags.d.ts
function mod {
	echo "declare module '$1' {
    const exports: typeof import('$2')
    export = exports
}"
}

function resource {
	mod "resource:///com/github/Aylur/ags/$1.js" "./$1"
}

function gi {
	mod "gi://$1" "node_modules/@girs/$2/$2"
}

dts="$dir/types/ags.d.ts"

echo "
declare function print(...args: any[]): void;

declare module console {
    export function error(obj: object, others?: object[]): void;
    export function error(msg: string, subsitutions?: any[]): void;
    export function log(obj: object, others?: object[]): void;
    export function log(msg: string, subsitutions?: any[]): void;
    export function warn(obj: object, others?: object[]): void;
    export function warn(msg: string, subsitutions?: any[]): void;
}
" >$dts

for file in ./src/*.ts; do
	f=$(basename -s .ts $file)
	if [[ "$f" != "main" && "$f" != "client" ]]; then
		resource "$(basename -s .ts $file)" >>$dts
	fi
done

for file in ./src/service/*.ts; do
	resource "service/$(basename -s .ts $file)" >>$dts
done

for file in ./src/widgets/*.ts; do
	resource "widgets/$(basename -s .ts $file)" >>$dts
done

gi "Gtk" "gtk-3.0" >>$dts
gi "GObject" "gobject-2.0" >>$dts
gi "Gio" "gio-2.0" >>$dts
gi "GLib" "glib-2.0" >>$dts

# remove tmp
rm -rf /tmp/ags-config

# npm i
echo "npm install @girs"
cd $dir
npm i
