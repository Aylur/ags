#include "river.h"
#include "gdk/gdk.h"
#include "glib-object.h"

#include <wayland-client.h>
#include <river-control-unstable-v1-client-protocol.h>
#include <river-status-unstable-v1-client-protocol.h>

#include <gdk/gdkwayland.h>

static const struct wl_registry_listener registry_listener;
static const struct zriver_output_status_v1_listener output_status_listener;

// GUtilsRiver

struct _GUtilsRiver {
    GObject parent_instance;

    struct zriver_status_manager_v1 *status_manager;
    struct zriver_control_v1 *control;
    GdkDisplay *display;
    gboolean valid;
};

G_DEFINE_TYPE(GUtilsRiver, gutils_river, G_TYPE_OBJECT)

enum {
    PROP_VALID = 1,

    NUM_RIVER_PROPS,
};

static void gutils_river_set_property(GObject      *object,
                                      guint         property_id,
                                      const GValue *value,
                                      GParamSpec   *pspec) {
    (void) value;
    G_OBJECT_WARN_INVALID_PROPERTY_ID (object, property_id, pspec);
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
            G_OBJECT_WARN_INVALID_PROPERTY_ID (object, property_id, pspec);
            break;
    }
}

static void gutils_river_dispose(GObject *object) {
    GUtilsRiver *self = (GUtilsRiver *) object;

    g_clear_object(&self->display);

    G_OBJECT_CLASS (gutils_river_parent_class)->dispose(object);
}

static void gutils_river_finalize(GObject *object) {
    GUtilsRiver *self = (GUtilsRiver *) object;

    g_clear_pointer(&self->control, zriver_control_v1_destroy);
    g_clear_pointer(&self->status_manager, zriver_status_manager_v1_destroy);

    G_OBJECT_CLASS(gutils_river_parent_class)->finalize(object);
}

static void gutils_river_class_init(GUtilsRiverClass *klass) {
    static GParamSpec *props[NUM_RIVER_PROPS] = { NULL, };

    GObjectClass *object_class = G_OBJECT_CLASS(klass);

    object_class->set_property = gutils_river_set_property;
    object_class->get_property = gutils_river_get_property;
    object_class->dispose = gutils_river_dispose;
    object_class->finalize = gutils_river_finalize;

    props[PROP_VALID] = g_param_spec_boolean("valid", NULL, NULL,
                                             FALSE,
                                             G_PARAM_READABLE);

    g_object_class_install_properties(object_class, NUM_RIVER_PROPS, props);
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
    if (self->status_manager == NULL || self->control == NULL) {
        g_warning("River was not detected.");
        return;
    }

    self->valid = TRUE;
}

static void handle_global(void *data, struct wl_registry *registry, uint32_t name, const char *interface, uint32_t version) {
    GUtilsRiver *river = data;

    if (!strcmp(interface, zriver_status_manager_v1_interface.name)) {
        river->status_manager = wl_registry_bind(registry, name, &zriver_status_manager_v1_interface, version);
    } else if (!strcmp(interface, zriver_control_v1_interface.name)) {
        river->control = wl_registry_bind(registry, name, &zriver_control_v1_interface, version);
    }
}

static void handle_global_remove(void *data, struct wl_registry *registry, uint32_t name) {
    (void) data;
    (void) registry;
    (void) name;
}

static const struct wl_registry_listener registry_listener = {
    .global = handle_global,
    .global_remove = handle_global_remove,
};

// GUtilsRiverMonitor

struct _GUtilsRiverMonitor {
    GObject parent_instance;

    GUtilsRiver *river;
    gboolean connected;
    int monitor;
};

G_DEFINE_TYPE(GUtilsRiverMonitor, gutils_river_monitor, G_TYPE_OBJECT)

enum {
    PROP_RIVER = 1,
    PROP_CONNECTED,
    PROP_MONITOR,

    NUM_RIVER_MONITOR_PROPS,
};

enum {
    SIGNAL_FOCUSED_TAGS,
    SIGNAL_VIEW_TAGS,
    SIGNAL_URGENT_TAGS,

    NUM_SIGNALS,
};
static guint signals[NUM_SIGNALS] = { 0 };

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

    G_OBJECT_CLASS (gutils_river_monitor_parent_class)->dispose(object);
}

static void gutils_river_monitor_class_init(GUtilsRiverMonitorClass *klass) {
    static GParamSpec *props[NUM_RIVER_MONITOR_PROPS] = { NULL, };

    GObjectClass *object_class = G_OBJECT_CLASS(klass);

    object_class->set_property = gutils_river_monitor_set_property;
    object_class->get_property = gutils_river_monitor_get_property;
    object_class->dispose = gutils_river_monitor_dispose;

    props[PROP_RIVER] =
        g_param_spec_object("river", NULL, NULL,
                            GUTILS_TYPE_RIVER,
                            G_PARAM_CONSTRUCT_ONLY | G_PARAM_READWRITE);

    props[PROP_CONNECTED] =
        g_param_spec_boolean("connected", NULL, NULL,
                             FALSE,
                             G_PARAM_READABLE);

    props[PROP_MONITOR] =
        g_param_spec_int("monitor", NULL, NULL,
                         0,
                         INT_MAX,
                         0,
                         G_PARAM_CONSTRUCT_ONLY | G_PARAM_READWRITE);

    g_object_class_install_properties(object_class, NUM_RIVER_MONITOR_PROPS, props);

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
}

static void gutils_river_monitor_init(GUtilsRiverMonitor *self) {
    (void) self;
}

void gutils_river_monitor_listen(GUtilsRiverMonitor *self) {
    g_return_if_fail(self->river != NULL && self->river->valid);

    GdkMonitor *gdk_monitor = gdk_display_get_monitor(self->river->display, self->monitor);
    struct wl_output *output = gdk_wayland_monitor_get_wl_output(gdk_monitor);
    if (output == NULL) {
        g_warning("Could not get Wayland monitor %d.", self->monitor);
        return;
    }

    struct zriver_output_status_v1 *output_status =
    zriver_status_manager_v1_get_river_output_status(self->river->status_manager, output);
    zriver_output_status_v1_add_listener(output_status, &output_status_listener, self);

    self->connected = TRUE;
}

static void handle_focused_tags(
    void *data,
    struct zriver_output_status_v1 *output,
    uint32_t tags) {
    (void) output;

    GUtilsRiverMonitor *self = GUTILS_RIVER_MONITOR(data);
    g_signal_emit(self, signals[SIGNAL_FOCUSED_TAGS], 0, tags);
}

static void handle_view_tags(
    void *data,
    struct zriver_output_status_v1 *output,
    struct wl_array *tags) {

    (void) output;

    GUtilsRiverMonitor *self = GUTILS_RIVER_MONITOR(data);

    GArray *array = g_array_new(FALSE, FALSE, sizeof(guint));

    uint32_t *tagptr;
    wl_array_for_each (tagptr, tags) {
        uint32_t tag = *tagptr;
        g_array_append_val(array, tag);
    }

    g_signal_emit(self, signals[SIGNAL_VIEW_TAGS], 0, array);
    g_array_free(array, TRUE);
}

static void handle_urgent_tags(
    void *data,
    struct zriver_output_status_v1 *output,
    uint32_t tags) {
    (void) output;

    GUtilsRiverMonitor *self = GUTILS_RIVER_MONITOR(data);
    g_signal_emit(self, signals[SIGNAL_URGENT_TAGS], 0, tags);
}

static void handle_layout_name(
    void *data,
    struct zriver_output_status_v1 *zriver_output_status_v1,
    const char *name) {
    (void) data;
    (void) zriver_output_status_v1;
    (void) name;
}

static void handle_layout_name_clear(
    void *data,
    struct zriver_output_status_v1 *zriver_output_status_v1) {
    (void) data;
    (void) zriver_output_status_v1;
}

static const struct zriver_output_status_v1_listener output_status_listener = {
    .focused_tags = handle_focused_tags,
    .view_tags = handle_view_tags,
    .urgent_tags = handle_urgent_tags,
    .layout_name = handle_layout_name,
    .layout_name_clear = handle_layout_name_clear,
};
