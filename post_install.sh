#!/usr/bin/env bash

DATA_DIR=$1
PKGDATA_DIR=$2
BIN_DIR="$DESTDIR/$3"
APP_ID=$4

mkdir -p $BIN_DIR

BIN_SRC="$PKGDATA_DIR/$APP_ID"
BIN_DEST="$BIN_DIR/ags"
ln -s -f $BIN_SRC $BIN_DEST

if [[ "$5" == "false" ]]; then
	exit 0
fi

SRC=$6
TYPES="$PKGDATA_DIR/types"

mkdir -p $TYPES

cp -r "$SRC/node_modules/@girs" "$TYPES/@girs"
tsc $SCR -d --declarationDir $TYPES --emitDeclarationOnly

find $TYPES -type f | xargs sed -i 's/gi:\/\/Gtk?version=3.0/.\/@girs\/gtk-3.0\/gtk-3.0/g'
find $TYPES -type f | xargs sed -i 's/gi:\/\/GObject/.\/@girs\/gobject-2.0\/gobject-2.0/g'
find $TYPES -type f | xargs sed -i 's/gi:\/\/Gio/.\/@girs\/gio-2.0\/gio-2.0/g'
find $TYPES -type f | xargs sed -i 's/gi:\/\/GLib/.\/@girs\/glib-2.0\/glib-2.0/g'
find $TYPES -type f | xargs sed -i 's/gi:\/\/GdkPixbuf/.\/@girs\/gdkpixbuf-2.0\/gdkpixbuf-2.0/g'
find $TYPES -type f | xargs sed -i 's/gi:\/\/Gdk/.\/@girs\/gdk-2.0\/gdk-2.0/g'
find $TYPES -type f | xargs sed -i 's/gi:\/\/Gvc/.\/@girs\/gvc-1.0\/gvc-1.0/g'
find $TYPES -type f | xargs sed -i 's/gi:\/\/NM/.\/@girs\/nm-1.0\/nm-1.0/g'
find $TYPES -type f | xargs sed -i 's/gi:\/\/DbusmenuGtk3/.\/@girs\/dbusmenugtk3-0.4\/dbusmenugtk3-0.4/g'

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
	mod "gi://$1" "./@girs/$2/$2"
}

dts="$TYPES/ags.d.ts"

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

for file in $SRC/src/*.ts; do
	f=$(basename -s .ts $file)
	if [[ "$f" != "main" && "$f" != "client" ]]; then
		resource "$(basename -s .ts $file)" >>$dts
	fi
done

for file in $SRC/src/service/*.ts; do
	resource "service/$(basename -s .ts $file)" >>$dts
done

for file in $SRC/src/widgets/*.ts; do
	resource "widgets/$(basename -s .ts $file)" >>$dts
done

gi "Gtk" "gtk-3.0" >>$dts
gi "GObject" "gobject-2.0" >>$dts
gi "Gio" "gio-2.0" >>$dts
gi "GLib" "glib-2.0" >>$dts
