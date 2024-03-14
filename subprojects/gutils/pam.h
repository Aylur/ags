#ifndef PAM_H
#define PAM_H

#include <glib-object.h>
#include <gio/gio.h>

G_BEGIN_DECLS

void gutils_authenticate_user (const char*          username,
                               const char*          password,
                               int                  io_priority,
                               GCancellable        *cancellable,
                               GAsyncReadyCallback  callback,
                               gpointer             user_data);

int gutils_authenticate_user_finish (GAsyncResult  *res,
                                     GError **error);


void gutils_authenticate (const char*          password,
                          int                  io_priority,
                          GCancellable        *cancellable,
                          GAsyncReadyCallback  callback,
                          gpointer             user_data);

int gutils_authenticate_finish (GAsyncResult  *res,
                                GError       **error);

G_END_DECLS

#endif // !PAM_H
