#ifndef RIVER_H
#define RIVER_H

#include <glib-object.h>
#include <gdk/gdk.h>

G_BEGIN_DECLS

struct zriver_status_manager_v1;
struct zriver_control_v1;
struct wl_seat;

struct _GUtilsRiver {
    GObject parent_instance;

    struct zriver_status_manager_v1 *status_manager;
    struct zriver_control_v1 *control;
    struct wl_seat *seat;

    struct zriver_seat_status_v1 *seat_status;

    GdkDisplay *display;
    gboolean valid;
};

#define GUTILS_TYPE_RIVER gutils_river_get_type()
G_DECLARE_FINAL_TYPE (GUtilsRiver, gutils_river, GUTILS, RIVER, GObject)

void gutils_river_listen(GUtilsRiver *self);

void gutils_river_resend_focus_signals(GUtilsRiver *self);

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
