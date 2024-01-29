#ifndef PAM_H
#define PAM_H

#include <glib-object.h>
#include <gio/gio.h>

G_BEGIN_DECLS

void ags_pam_authenticate_user (const char*          username,
                                const char*          password,
                                int                  io_priority,
                                GCancellable        *cancellable,
                                GAsyncReadyCallback  callback,
                                gpointer             user_data);

int ags_pam_authenticate_user_finish (GAsyncResult  *res,
                                      GError **error);


void ags_pam_authenticate (const char*          password,
                           int                  io_priority,
                           GCancellable        *cancellable,
                           GAsyncReadyCallback  callback,
                           gpointer             user_data);

int ags_pam_authenticate_finish (GAsyncResult  *res,
                                 GError       **error);

G_END_DECLS

#endif // !PAM_H
