#include "pam.h"
#include <pwd.h>
#include <security/pam_appl.h>
#include <security/pam_misc.h>

struct _Pam {
    GObject parent_instance;
};

G_DEFINE_TYPE (Pam, ags_pam, G_TYPE_OBJECT);

static void ags_pam_init(Pam *self){}
static void ags_pam_class_init(PamClass *klass){}

static struct pam_conv conv = {
    misc_conv,
    NULL
};

int handle_conversation(int num_msg, const struct pam_message **msg, struct pam_response **resp, void *appdata_ptr) {
    struct pam_response *replies = NULL;
    if (num_msg <= 0 || num_msg > PAM_MAX_NUM_MSG) {
        return PAM_CONV_ERR;
    }

    replies = (struct pam_response *)calloc(num_msg, sizeof(struct pam_response));
    if (replies == NULL){
        return PAM_BUF_ERR;
    }

    for (int i = 0; i < num_msg; ++i) {
	    	switch (msg[i]->msg_style) {
        		case PAM_PROMPT_ECHO_OFF:
            case PAM_PROMPT_ECHO_ON:
                replies[i].resp = strdup((const char *)appdata_ptr);
                if (replies[i].resp == NULL) {
                    return PAM_ABORT;
                }
                break;
            case PAM_ERROR_MSG:
            case PAM_TEXT_INFO:
                  break;
          }
	  }

    *resp = replies;

    return PAM_SUCCESS;
}

gboolean ags_pam_authenticate_user(const char *username, const char *password) {

    pam_handle_t *pamh = NULL;
    // struct pam_conv conv = { handle_conversation, (void *)password };
  	const struct pam_conv conv = {
		  .conv = handle_conversation,
		  .appdata_ptr = (void *) password,
	  };
    int retval;
    gboolean success = FALSE;

    retval = pam_start("ags", username, &conv, &pamh);

    if (retval == PAM_SUCCESS) {
        retval = pam_authenticate(pamh, 0);
        if (retval == PAM_SUCCESS)
            success = TRUE;
        pam_end(pamh, retval);
    }

    return success;
}

gboolean ags_pam_authenticate(const char *password) {
    struct passwd *passwd = getpwuid(getuid());
    char *username = passwd->pw_name;

    return ags_pam_authenticate_user(username, password);
}


