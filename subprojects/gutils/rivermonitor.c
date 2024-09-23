#include "river.h"
#include "rivermonitor.h"
#include "river-private.h"

#include <wayland-client.h>
#include <river-control-unstable-v1-client-protocol.h>
#include <river-status-unstable-v1-client-protocol.h>

#include <gdk/gdkwayland.h>

enum {
    PROP_RIVER = 1,
    PROP_CONNECTED,
    PROP_MONITOR,
    NUM_PROPS,
};

enum {
    SIGNAL_FOCUSED_TAGS,
    SIGNAL_VIEW_TAGS,
    SIGNAL_URGENT_TAGS,
    SIGNAL_LAYOUT_NAME,
    NUM_SIGNALS,
};

static guint signals[NUM_SIGNALS] = { 0 };

struct _GUtilsRiverMonitor {
    GObject parent_instance;

    struct zriver_output_status_v1 *output_status;
    struct zriver_seat_status_v1 *seat_status;

    GUtilsRiver *river;
    gboolean connected;
    int monitor;
};

G_DEFINE_TYPE(GUtilsRiverMonitor, gutils_river_monitor, G_TYPE_OBJECT)

static void handle_focused_tags(void                           *data,
                                struct zriver_output_status_v1 *output,
                                uint32_t                        tags) {
    (void) output;

    GUtilsRiverMonitor *self = GUTILS_RIVER_MONITOR(data);
    g_signal_emit(self, signals[SIGNAL_FOCUSED_TAGS], 0, tags);
}

static void handle_view_tags(void                           *data,
                             struct zriver_output_status_v1 *output,
                             struct wl_array                *tags) {
    (void) output;

    GUtilsRiverMonitor *self = GUTILS_RIVER_MONITOR(data);

    GArray *array = g_array_new(FALSE, FALSE, sizeof(guint));

    uint32_t *tagptr;
    wl_array_for_each(tagptr, tags) {
        uint32_t tag = *tagptr;
        g_array_append_val(array, tag);
    }

    g_signal_emit(self, signals[SIGNAL_VIEW_TAGS], 0, array);
    g_array_free(array, TRUE);
}

static void handle_urgent_tags(void                           *data,
                               struct zriver_output_status_v1 *output,
                               uint32_t                        tags) {
    (void) output;

    GUtilsRiverMonitor *self = GUTILS_RIVER_MONITOR(data);
    g_signal_emit(self, signals[SIGNAL_URGENT_TAGS], 0, tags);
}

static void handle_layout_name(void                           *data,
                               struct zriver_output_status_v1 *output,
                               const char                     *name) {
    (void) output;

    GUtilsRiverMonitor *self = GUTILS_RIVER_MONITOR(data);
    g_signal_emit(self, signals[SIGNAL_LAYOUT_NAME], 0, name);
}

static void handle_layout_name_clear(void                           *data,
                                     struct zriver_output_status_v1 *output) {
    (void) data;
    (void) output;

    GUtilsRiverMonitor *self = GUTILS_RIVER_MONITOR(data);
    g_signal_emit(self, signals[SIGNAL_LAYOUT_NAME], 0, NULL);
}

static const struct zriver_output_status_v1_listener output_status_listener = {
    .focused_tags = handle_focused_tags,
    .view_tags = handle_view_tags,
    .urgent_tags = handle_urgent_tags,
    .layout_name = handle_layout_name,
    .layout_name_clear = handle_layout_name_clear,
};

static void gutils_river_monitor_set_property(GObject      *object,
                                              guint         property_id,
                                              const GValue *value,
                                              GParamSpec   *pspec) {
    GUtilsRiverMonitor *self = GUTILS_RIVER_MONITOR(object);

    switch (property_id) {
        case PROP_RIVER:
            g_set_object(&self->river, g_value_get_object(value));
            break;

        case PROP_MONITOR:
            self->monitor = g_value_get_int(value);
            break;

        default:
            G_OBJECT_WARN_INVALID_PROPERTY_ID(object, property_id, pspec);
            break;
    }
}

static void gutils_river_monitor_get_property(GObject    *object,
                                              guint       property_id,
                                              GValue     *value,
                                              GParamSpec *pspec) {
    GUtilsRiverMonitor *self = GUTILS_RIVER_MONITOR(object);

    switch (property_id) {
        case PROP_RIVER:
            g_value_set_object(value, self->river);
            break;

        case PROP_CONNECTED:
            g_value_set_boolean(value, self->connected);
            break;

        case PROP_MONITOR:
            g_value_set_int(value, self->monitor);
            break;

        default:
            G_OBJECT_WARN_INVALID_PROPERTY_ID(object, property_id, pspec);
            break;
    }
}

static void gutils_river_monitor_dispose(GObject *object) {
    GUtilsRiverMonitor *self = (GUtilsRiverMonitor *) object;

    g_clear_object(&self->river);

    G_OBJECT_CLASS(gutils_river_monitor_parent_class)->dispose(object);
}

static void gutils_river_monitor_finalize(GObject *object) {
    GUtilsRiverMonitor *self = (GUtilsRiverMonitor *) object;

    g_clear_pointer(&self->output_status, zriver_output_status_v1_destroy);

    G_OBJECT_CLASS(gutils_river_monitor_parent_class)->dispose(object);
}

static void gutils_river_monitor_class_init(GUtilsRiverMonitorClass *klass) {
    static GParamSpec *props[NUM_PROPS] = { NULL, };

    GObjectClass *object_class = G_OBJECT_CLASS(klass);

    object_class->set_property = gutils_river_monitor_set_property;
    object_class->get_property = gutils_river_monitor_get_property;
    object_class->dispose = gutils_river_monitor_dispose;
    object_class->finalize = gutils_river_monitor_finalize;

    /**
     * GUtilsRiverMonitor:river:
     *
     * The base #GUtilsRiver.
     */
    props[PROP_RIVER] =
        g_param_spec_object("river", NULL, NULL,
                            GUTILS_TYPE_RIVER,
                            G_PARAM_CONSTRUCT_ONLY | G_PARAM_READWRITE);

    /**
     * GUtilsRiverMonitor:connected:
     *
     * True if listeners are connected.
     */
    props[PROP_CONNECTED] =
        g_param_spec_boolean("connected", NULL, NULL,
                             FALSE,
                             G_PARAM_READABLE);

    /**
     * GUtilsRiverMonitor:monitor:
     *
     * The monitor index.
     */
    props[PROP_MONITOR] =
        g_param_spec_int("monitor", NULL, NULL,
                         0,
                         INT_MAX,
                         0,
                         G_PARAM_CONSTRUCT_ONLY | G_PARAM_READWRITE);

    g_object_class_install_properties(object_class, NUM_PROPS, props);

    /**
     * GUtilsRiverMonitor::focused-tags:
     * @object: a #GUtilsRiverMonitor.
     * @tags: bitflags of the focused tags.
     */
    signals[SIGNAL_FOCUSED_TAGS] =
        g_signal_new(g_intern_static_string("focused-tags"),
                     GUTILS_TYPE_RIVER_MONITOR,
                     G_SIGNAL_RUN_LAST,
                     0, NULL, NULL,
                     NULL,
                     G_TYPE_NONE, 1, G_TYPE_UINT);

    /**
     * GUtilsRiverMonitor::view-tags:
     * @object: a #GUtilsRiverMonitor.
     * @tags: (element-type guint): an array of bitflags representing each view.
     */
    signals[SIGNAL_VIEW_TAGS] =
        g_signal_new(g_intern_static_string("view-tags"),
                     GUTILS_TYPE_RIVER_MONITOR,
                     G_SIGNAL_RUN_LAST,
                     0, NULL, NULL,
                     NULL,
                     G_TYPE_NONE, 1, G_TYPE_ARRAY);

    /**
     * GUtilsRiverMonitor::urgent-tags:
     * @object: a #GUtilsRiverMonitor.
     * @tags: bitflags of the urgent tags.
     */
    signals[SIGNAL_URGENT_TAGS] =
        g_signal_new(g_intern_static_string("urgent-tags"),
                     GUTILS_TYPE_RIVER_MONITOR,
                     G_SIGNAL_RUN_LAST,
                     0, NULL, NULL,
                     NULL,
                     G_TYPE_NONE, 1, G_TYPE_UINT);

    /**
     * GUtilsRiverMonitor::layout-name:
     * @object: a #GUtilsRiverMonitor.
     * @name: (nullable): The new layout name, or NULL if the name is unset.
     */
    signals[SIGNAL_LAYOUT_NAME] =
        g_signal_new(g_intern_static_string("layout-name"),
                     GUTILS_TYPE_RIVER_MONITOR,
                     G_SIGNAL_RUN_LAST,
                     0, NULL, NULL,
                     NULL,
                     G_TYPE_NONE, 1, G_TYPE_STRING);
}

static void gutils_river_monitor_init(GUtilsRiverMonitor *self) {
    (void) self;
}

/**
 * gutils_river_monitor_listen:
 * @self: a #GUtilsRiverMonitor
 *
 * Connects Wayland listeners.
 */
void gutils_river_monitor_listen(GUtilsRiverMonitor *self) {
    g_return_if_fail(self->river != NULL && self->river->valid);

    GdkMonitor *gdk_monitor = gdk_display_get_monitor(self->river->display, self->monitor);
    struct wl_output *output = gdk_wayland_monitor_get_wl_output(gdk_monitor);
    if (output == NULL) {
        g_warning("Could not get Wayland monitor %d.", self->monitor);
        return;
    }

    self->output_status =
        zriver_status_manager_v1_get_river_output_status(self->river->status_manager, output);
    zriver_output_status_v1_add_listener(self->output_status, &output_status_listener, self);

    self->connected = TRUE;
}
