#include "river.h"
#include "river-output.h"

#include <gdk/gdkwayland.h>

#include <river-status-unstable-v1-client-protocol.h>

enum {
    PROP_CONNECTED = 1,
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

static GParamSpec *props[NUM_PROPS] = { NULL, };
static guint signals[NUM_SIGNALS] = { 0 };

G_DEFINE_TYPE(GUtilsRiverOutput, gutils_river_output, G_TYPE_OBJECT)

static void handle_focused_tags(void                           *data,
                                struct zriver_output_status_v1 *output,
                                uint32_t                        tags) {
    (void) output;

    GUtilsRiverOutput *self = data;
    g_signal_emit(self, signals[SIGNAL_FOCUSED_TAGS], 0, tags);
}

static void handle_view_tags(void                           *data,
                             struct zriver_output_status_v1 *output,
                             struct wl_array                *tags) {
    (void) output;

    GUtilsRiverOutput *self = GUTILS_RIVER_OUTPUT(data);

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

    GUtilsRiverOutput *self = GUTILS_RIVER_OUTPUT(data);
    g_signal_emit(self, signals[SIGNAL_URGENT_TAGS], 0, tags);
}

static void handle_layout_name(void                           *data,
                               struct zriver_output_status_v1 *output,
                               const char                     *name) {
    (void) output;

    GUtilsRiverOutput *self = GUTILS_RIVER_OUTPUT(data);
    g_signal_emit(self, signals[SIGNAL_LAYOUT_NAME], 0, name);
}

static void handle_layout_name_clear(void                           *data,
                                     struct zriver_output_status_v1 *output) {
    (void) data;
    (void) output;

    GUtilsRiverOutput *self = GUTILS_RIVER_OUTPUT(data);
    g_signal_emit(self, signals[SIGNAL_LAYOUT_NAME], 0, NULL);
}

static const struct zriver_output_status_v1_listener output_status_listener = {
    .focused_tags = handle_focused_tags,
    .view_tags = handle_view_tags,
    .urgent_tags = handle_urgent_tags,
    .layout_name = handle_layout_name,
    .layout_name_clear = handle_layout_name_clear,
};

static void gutils_river_output_set_property(GObject      *object,
                                             guint         property_id,
                                             const GValue *value,
                                             GParamSpec   *pspec) {
    GUtilsRiverOutput *self = (GUtilsRiverOutput *) object;

    switch (property_id) {
        case PROP_MONITOR:
            g_set_object(&self->monitor, g_value_get_object(value));
            break;

        default:
            G_OBJECT_WARN_INVALID_PROPERTY_ID(object, property_id, pspec);
            break;
    }
}

static void gutils_river_output_get_property(GObject    *object,
                                             guint       property_id,
                                             GValue     *value,
                                             GParamSpec *pspec) {
    GUtilsRiverOutput *self = (GUtilsRiverOutput *) object;

    switch (property_id) {
        case PROP_CONNECTED:
            g_value_set_boolean(value, self->connected);
            break;

        case PROP_MONITOR:
            g_value_set_object(value, self->monitor);
            break;

        default:
            G_OBJECT_WARN_INVALID_PROPERTY_ID(object, property_id, pspec);
            break;
    }
}

static void gutils_river_output_dispose(GObject *object) {
    GUtilsRiverOutput *self = (GUtilsRiverOutput *) object;

    g_clear_object(&self->monitor);

    G_OBJECT_CLASS(gutils_river_output_parent_class)->dispose(object);
}

static void gutils_river_output_finalize(GObject *object) {
    GUtilsRiverOutput *self = (GUtilsRiverOutput *) object;

    g_clear_pointer(&self->output_status, zriver_output_status_v1_destroy);

    G_OBJECT_CLASS(gutils_river_output_parent_class)->dispose(object);
}

static GObject *gutils_river_output_constructor(GType                  type,
                                                guint                  n_construct_properties,
                                                GObjectConstructParam *construct_params) {
    GObject *object =
        G_OBJECT_CLASS(gutils_river_output_parent_class)->constructor(type,
                                                                      n_construct_properties,
                                                                      construct_params);
    GUtilsRiverOutput *self = (GUtilsRiverOutput *) object;
    if (self->monitor != NULL) {
        self->output = gdk_wayland_monitor_get_wl_output(self->monitor);
    }

    return object;
}

static void gutils_river_output_class_init(GUtilsRiverOutputClass *klass) {
    GObjectClass *object_class = G_OBJECT_CLASS(klass);

    object_class->set_property = gutils_river_output_set_property;
    object_class->get_property = gutils_river_output_get_property;
    object_class->dispose = gutils_river_output_dispose;
    object_class->finalize = gutils_river_output_finalize;
    object_class->constructor = gutils_river_output_constructor;

    /**
     * GUtilsRiverOutput:connected:
     *
     * True if listeners are connected.
     */
    props[PROP_CONNECTED] =
        g_param_spec_boolean("connected", NULL, NULL,
                             FALSE,
                             G_PARAM_READABLE);

    /**
     * GUtilsRiverOutput:monitor:
     *
     * The monitor object.
     */
    props[PROP_MONITOR] =
        g_param_spec_object("monitor", NULL, NULL,
                         GDK_TYPE_MONITOR,
                         G_PARAM_CONSTRUCT_ONLY | G_PARAM_READWRITE);

    g_object_class_install_properties(object_class, NUM_PROPS, props);

    /**
     * GUtilsRiverOutput::focused-tags:
     * @object: a #GUtilsRiverOutput.
     * @tags: bitflags of the focused tags.
     */
    signals[SIGNAL_FOCUSED_TAGS] =
        g_signal_new(g_intern_static_string("focused-tags"),
                     GUTILS_TYPE_RIVER_OUTPUT,
                     G_SIGNAL_RUN_LAST,
                     0, NULL, NULL,
                     NULL,
                     G_TYPE_NONE, 1, G_TYPE_UINT);

    /**
     * GUtilsRiverOutput::view-tags:
     * @object: a #GUtilsRiverOutput.
     * @tags: (element-type guint): an array of bitflags representing each view.
     */
    signals[SIGNAL_VIEW_TAGS] =
        g_signal_new(g_intern_static_string("view-tags"),
                     GUTILS_TYPE_RIVER_OUTPUT,
                     G_SIGNAL_RUN_LAST,
                     0, NULL, NULL,
                     NULL,
                     G_TYPE_NONE, 1, G_TYPE_ARRAY);

    /**
     * GUtilsRiverOutput::urgent-tags:
     * @object: a #GUtilsRiverOutput.
     * @tags: bitflags of the urgent tags.
     */
    signals[SIGNAL_URGENT_TAGS] =
        g_signal_new(g_intern_static_string("urgent-tags"),
                     GUTILS_TYPE_RIVER_OUTPUT,
                     G_SIGNAL_RUN_LAST,
                     0, NULL, NULL,
                     NULL,
                     G_TYPE_NONE, 1, G_TYPE_UINT);

    /**
     * GUtilsRiverOutput::layout-name:
     * @object: a #GUtilsRiverOutput.
     * @name: (nullable): The new layout name, or %NULL if the name is unset.
     */
    signals[SIGNAL_LAYOUT_NAME] =
        g_signal_new(g_intern_static_string("layout-name"),
                     GUTILS_TYPE_RIVER_OUTPUT,
                     G_SIGNAL_RUN_LAST,
                     0, NULL, NULL,
                     NULL,
                     G_TYPE_NONE, 1, G_TYPE_STRING);
}

static void gutils_river_output_init(GUtilsRiverOutput *self) {
    (void) self;
}

/**
 * gutils_river_output_listen:
 * @self: a #GUtilsRiverOutput
 * @river: a #GUtilsRiver
 *
 * Connects Wayland listeners.
 */
void gutils_river_output_listen(GUtilsRiverOutput *self,
                                GUtilsRiver       *river) {
    g_return_if_fail(river != NULL && river->valid);

    // Nothing to do if already connected.
    if (self->connected)
        return;

    if (self->output == NULL) {
        g_warning("Could not get Wayland monitor for %s.", gdk_monitor_get_model(self->monitor));
        return;
    }

    self->output_status =
        zriver_status_manager_v1_get_river_output_status(river->status_manager, self->output);
    zriver_output_status_v1_add_listener(self->output_status, &output_status_listener, self);

    self->connected = TRUE;
}
