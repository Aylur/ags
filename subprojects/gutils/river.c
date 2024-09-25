#include "river.h"
#include "river-output.h"

#include <gdk/gdkwayland.h>

#include <wayland-client.h>
#include <river-control-unstable-v1-client-protocol.h>
#include <river-status-unstable-v1-client-protocol.h>

enum {
    PROP_VALID = 1,
    NUM_PROPS,
};

enum {
    SIGNAL_FOCUSED_VIEW,
    SIGNAL_MODE,
    NUM_SIGNALS,
};

static GParamSpec *props[NUM_PROPS] = { NULL, };
static guint signals[NUM_SIGNALS] = { 0 };

static void handle_global(void               *data,
                          struct wl_registry *registry,
                          uint32_t            name,
                          const char         *interface,
                          uint32_t            version) {
    GUtilsRiver *river = data;

    if (!strcmp(interface, zriver_status_manager_v1_interface.name)) {
        river->status_manager = wl_registry_bind(registry, name, &zriver_status_manager_v1_interface, version);
    } else if (!strcmp(interface, zriver_control_v1_interface.name)) {
        river->control = wl_registry_bind(registry, name, &zriver_control_v1_interface, version);
    } else if (!strcmp(interface, wl_seat_interface.name)) {
        river->seat = wl_registry_bind(registry, name, &wl_seat_interface, version);
    }
}

static void handle_global_remove(void               *data,
                                 struct wl_registry *registry,
                                 uint32_t            name) {
    (void) data;
    (void) registry;
    (void) name;
}

static const struct wl_registry_listener registry_listener = {
    .global = handle_global,
    .global_remove = handle_global_remove,
};

static void handle_success(void                              *data,
                           struct zriver_command_callback_v1 *command_callback,
                           const char                        *output) {
    (void) command_callback;

    GTask *task = data;
    g_task_return_pointer(task, g_strdup(output), g_free);
    g_object_unref(task);
}

static void handle_failure(void                              *data,
                           struct zriver_command_callback_v1 *command_callback,
                           const char                        *output) {
    (void) command_callback;

    GTask *task = data;
    g_task_return_new_error(task, G_IO_ERROR, G_IO_ERROR_FAILED, "%s", output);
    g_object_unref(task);
}

static const struct zriver_command_callback_v1_listener command_callback_listener = {
    .success = handle_success,
    .failure = handle_failure,
};

static void handle_focused_unfocused_output(void                         *data,
                                            struct zriver_seat_status_v1 *seat_status,
                                            struct wl_output             *output) {
    (void) data;
    (void) seat_status;
    (void) output;
}

static void handle_mode(void                         *data,
                        struct zriver_seat_status_v1 *seat_status,
                        const char                   *name) {
    (void) seat_status;

    GUtilsRiver *self = data;
    g_signal_emit(self, signals[SIGNAL_MODE], 0, name);
}

static void handle_focused_view(void                         *data,
                                struct zriver_seat_status_v1 *seat_status,
                                const char                   *title) {
    (void) seat_status;

    GUtilsRiver *self = data;
    g_signal_emit(self, signals[SIGNAL_FOCUSED_VIEW], 0, title);
}

static const struct zriver_seat_status_v1_listener seat_status_listener = {
    .focused_output = handle_focused_unfocused_output,
    .unfocused_output = handle_focused_unfocused_output,
    .focused_view = handle_focused_view,
    .mode = handle_mode,
};

G_DEFINE_TYPE(GUtilsRiver, gutils_river, G_TYPE_OBJECT)

static void gutils_river_set_property(GObject      *object,
                                      guint         property_id,
                                      const GValue *value,
                                      GParamSpec   *pspec) {
    (void) value;
    G_OBJECT_WARN_INVALID_PROPERTY_ID(object, property_id, pspec);
}

static void gutils_river_get_property(GObject    *object,
                                      guint       property_id,
                                      GValue     *value,
                                      GParamSpec *pspec) {
    GUtilsRiver *self = GUTILS_RIVER(object);

    switch (property_id) {
        case PROP_VALID:
            g_value_set_boolean(value, self->valid);
            break;

        default:
            G_OBJECT_WARN_INVALID_PROPERTY_ID(object, property_id, pspec);
            break;
    }
}

static void gutils_river_dispose(GObject *object) {
    GUtilsRiver *self = (GUtilsRiver *) object;

    g_clear_object(&self->display);

    G_OBJECT_CLASS(gutils_river_parent_class)->dispose(object);
}

static void gutils_river_finalize(GObject *object) {
    GUtilsRiver *self = (GUtilsRiver *) object;

    g_clear_pointer(&self->seat_status, zriver_seat_status_v1_destroy);

    g_clear_pointer(&self->control, zriver_control_v1_destroy);
    g_clear_pointer(&self->status_manager, zriver_status_manager_v1_destroy);
    g_clear_pointer(&self->seat, wl_seat_destroy);

    G_OBJECT_CLASS(gutils_river_parent_class)->finalize(object);
}

static void gutils_river_class_init(GUtilsRiverClass *klass) {
    GObjectClass *object_class = G_OBJECT_CLASS(klass);

    object_class->set_property = gutils_river_set_property;
    object_class->get_property = gutils_river_get_property;
    object_class->dispose = gutils_river_dispose;
    object_class->finalize = gutils_river_finalize;

    /**
     * GUtilsRiver:valid:
     *
     * True if river was detected.
     */
    props[PROP_VALID] =
        g_param_spec_boolean("valid", NULL, NULL,
                             FALSE,
                             G_PARAM_READABLE);

    g_object_class_install_properties(object_class, NUM_PROPS, props);

    /**
     * GUtilsRiver::focused-view:
     * @object: a #GUtilsRiver.
     * @title: a string containing the view's title.
     */
    signals[SIGNAL_FOCUSED_VIEW] =
        g_signal_new(g_intern_static_string("focused-view"),
                     GUTILS_TYPE_RIVER,
                     G_SIGNAL_RUN_LAST,
                     0, NULL, NULL,
                     NULL,
                     G_TYPE_NONE, 1, G_TYPE_STRING);

    /**
     * GUtilsRiver::mode:
     * @object: a #GUtilsRiver.
     * @mode: the mode
     */
    signals[SIGNAL_MODE] =
        g_signal_new(g_intern_static_string("mode"),
                     GUTILS_TYPE_RIVER,
                     G_SIGNAL_RUN_LAST,
                     0, NULL, NULL,
                     NULL,
                     G_TYPE_NONE, 1, G_TYPE_STRING);
}

static void gutils_river_init(GUtilsRiver *self) {
    self->display = g_object_ref(gdk_display_get_default());

    struct wl_display *display = gdk_wayland_display_get_wl_display(self->display);
    if (display == NULL) {
        g_warning("Could not get Wayland display.");
        return;
    }

    struct wl_registry *registry = wl_display_get_registry(display);
    wl_registry_add_listener(registry, &registry_listener, self);
    wl_display_roundtrip(display);
    if (self->status_manager == NULL || self->control == NULL || self->seat == NULL) {
        return;
    }

    self->valid = TRUE;
}

/**
 * gutils_river_listen:
 * @self: a #GUtilsRiver
 *
 * Connects Wayland listeners.
 */
void gutils_river_listen(GUtilsRiver *self) {
    g_return_if_fail(self->valid);

    self->seat_status =
        zriver_status_manager_v1_get_river_seat_status(self->status_manager, self->seat);
    zriver_seat_status_v1_add_listener(self->seat_status, &seat_status_listener, self);
}

/**
 * gutils_river_send_command:
 * @self: a #GUtilsRiver
 * @arguments: (array zero-terminated=1) (element-type utf8): the list of arguments
 * @io_priority: the I/O priority
 * @cancellable: (nullable): optional #GCancellable object, %NULL to ignore
 * @callback: (scope async) (closure user_data): a #GAsyncReadyCallback
 *   to call when the request is satisfied
 * @user_data: the data to pass to callback function
 *
 * Sends a command to riverctl.
 */
void gutils_river_send_command(GUtilsRiver         *self,
                               const char *const   *arguments,
                               int                  io_priority,
                               GCancellable        *cancellable,
                               GAsyncReadyCallback  callback,
                               gpointer             user_data) {
    g_return_if_fail(self->valid);

    const char *arg;
    while ((arg = *arguments++)) {
        zriver_control_v1_add_argument(self->control, arg);
    }

    struct zriver_command_callback_v1 *command_callback =
        zriver_control_v1_run_command(self->control, self->seat);

    GTask *task = g_task_new(NULL, cancellable, callback, user_data);
    g_task_set_priority(task, io_priority);
    zriver_command_callback_v1_add_listener(command_callback, &command_callback_listener, task);
}

char *gutils_river_send_command_finish(GUtilsRiver   *self,
                                       GAsyncResult  *res,
                                       GError       **error) {
    (void) self;

    return g_task_propagate_pointer(G_TASK(res), error);
}
