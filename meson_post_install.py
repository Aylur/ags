#!/usr/bin/env python3

import os
import subprocess
import sys

destdir = os.environ.get('DESTDIR', '')
datadir = sys.argv[1]
pkgdatadir = sys.argv[2]
bindir = os.path.join(destdir + os.sep + sys.argv[3])
app_id = sys.argv[4]

if not os.path.exists(bindir):
    os.makedirs(bindir)

src = os.path.join(pkgdatadir, app_id)
dest = os.path.join(bindir, 'ags')
subprocess.call(['ln', '-s', '-f', src, dest])
