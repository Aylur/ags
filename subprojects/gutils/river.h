#ifndef RIVER_H
#define RIVER_H

#include <glib-object.h>
#include <gio/gio.h>

G_BEGIN_DECLS

#define GUTILS_TYPE_RIVER gutils_river_get_type()
G_DECLARE_FINAL_TYPE (GUtilsRiver, gutils_river, GUTILS, RIVER, GObject)

void gutils_river_listen(GUtilsRiver *self);

void gutils_river_send_command(GUtilsRiver         *self,
                               const char *const   *arguments,
                               int                  io_priority,
                               GCancellable        *cancellable,
                               GAsyncReadyCallback  callback,
                               gpointer             user_data);

char *gutils_river_send_command_finish(GUtilsRiver   *self,
                                       GAsyncResult  *res,
                                       GError       **error);

G_END_DECLS

#endif // !RIVER_H
