#ifndef PAM_H
#define PAM_H

#include <glib-object.h>

G_BEGIN_DECLS
#define GI_TYPE_PAM (ags_pam_get_type())

G_DECLARE_FINAL_TYPE (Pam, ags_pam, Pam, Pam, GObject)

gboolean ags_pam_authenticate(const gchar *password);
gboolean ags_pam_authenticate_user(const gchar *username, const gchar *password);

G_END_DECLS

#endif // !PAM_H
