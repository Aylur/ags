#ifndef RIVERMONITOR_H
#define RIVERMONITOR_H

#include <glib-object.h>
#include <gio/gio.h>

G_BEGIN_DECLS

#define GUTILS_TYPE_RIVER_MONITOR gutils_river_monitor_get_type()
G_DECLARE_FINAL_TYPE (GUtilsRiverMonitor, gutils_river_monitor, GUTILS, RIVER_MONITOR, GObject)

void gutils_river_monitor_listen(GUtilsRiverMonitor *self);

G_END_DECLS

#endif // !RIVER_H
