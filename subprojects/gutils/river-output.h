#ifndef RIVER_OUTPUT_H
#define RIVER_OUTPUT_H

#include <glib-object.h>
#include <gdk/gdk.h>

G_BEGIN_DECLS

struct zriver_output_status_v1;
struct wl_output;

struct _GUtilsRiverOutput {
    GObject parent_instance;

    struct zriver_output_status_v1 *output_status;
    struct wl_output *output;

    GdkMonitor *monitor;
    gboolean connected;
};

#define GUTILS_TYPE_RIVER_OUTPUT gutils_river_output_get_type()
G_DECLARE_FINAL_TYPE (GUtilsRiverOutput, gutils_river_output, GUTILS, RIVER_OUTPUT, GObject)

struct wl_output;
typedef struct _GUtilsRiver GUtilsRiver;

void gutils_river_output_listen(GUtilsRiverOutput *self,
                                GUtilsRiver       *river);

G_END_DECLS

#endif // !RIVER_OUTPUT_H
