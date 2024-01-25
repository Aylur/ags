#ifndef PAM_H
#define PAM_H

#include <glib-object.h>

G_BEGIN_DECLS

gboolean ags_pam_authenticate(const gchar *password);
gboolean ags_pam_authenticate_user(const gchar *username, const gchar *password);

G_END_DECLS

#endif // !PAM_H
