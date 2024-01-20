#!/usr/bin/env bash

DATA_DIR="$DESTDIR/$1"
PKGDATA_DIR="$DESTDIR/$2"
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

tsc $SCR -d --declarationDir $TYPES --emitDeclarationOnly

function fixPaths {
	sed -i 's/node_modules/types/g' $1
	sed -i 's/import("@girs/import("types\/@girs/g' $1
}

export -f fixPaths
find $TYPES -type f | xargs -I % bash -c "fixPaths %"
cp -r "$SRC/node_modules/@girs" "$TYPES/@girs"

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

dts="$TYPES/ags.d.ts"

echo "declare function print(...args: any[]): void;" >$dts

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
