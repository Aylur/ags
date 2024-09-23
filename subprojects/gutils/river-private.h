#ifndef RIVER_PRIVATE_H
#define RIVER_PRIVATE_H

#include <glib-object.h>
#include <gdk/gdkwayland.h>

#include <wayland-client.h>
#include <river-control-unstable-v1-client-protocol.h>
#include <river-status-unstable-v1-client-protocol.h>

struct _GUtilsRiver {
    GObject parent_instance;

    struct zriver_status_manager_v1 *status_manager;
    struct zriver_control_v1 *control;
    struct wl_seat *seat;

    struct zriver_seat_status_v1 *seat_status;

    GdkDisplay *display;
    gboolean valid;
};

#endif
