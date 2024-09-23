#ifndef RIVER_H
#define RIVER_H

#include <glib-object.h>
#include <gio/gio.h>

G_BEGIN_DECLS

#define GUTILS_TYPE_RIVER gutils_river_get_type()
G_DECLARE_FINAL_TYPE (GUtilsRiver, gutils_river, GUTILS, RIVER, GObject)

#define GUTILS_TYPE_RIVER_MONITOR gutils_river_monitor_get_type()
G_DECLARE_FINAL_TYPE (GUtilsRiverMonitor, gutils_river_monitor, GUTILS, RIVER_MONITOR, GObject)

void gutils_river_listen(GUtilsRiver *self);

/**
 * gutils_river_send_command:
 * @self: a #GUtilsRiver
 * @arguments: (array zero-terminated=1) (element-type utf8): the list of arguments
 */
void gutils_river_send_command(GUtilsRiver *self, const char *const *arguments);

void gutils_river_monitor_listen(GUtilsRiverMonitor *self);

G_END_DECLS

#endif // !RIVER_H
