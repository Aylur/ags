#include "pam.h"
#include <gio/gio.h>
#include <pwd.h>
#include <security/pam_appl.h>
#include <string.h>

typedef struct {
    gchar *username;
    gchar *password;
} auth_info;

void free_auth_info(void* data) {
    auth_info* info = (auth_info*) data;
    free(info->username);
    free(info->password);
    free(info);
}

int handle_conversation(int                         num_msg,
                        const struct pam_message  **msg,
                        struct pam_response       **resp,
                        void                       *appdata_ptr) {
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

void auth_thread (GTask         *task,
                  gpointer       object,
                  gpointer       task_data,
                  GCancellable  *cancellable) {
    auth_info *info = (auth_info *)task_data;

    pam_handle_t *pamh = NULL;
    const struct pam_conv conv = {
      .conv = handle_conversation,
      .appdata_ptr = (void *) info->password,
    };
    int retval;
    retval = pam_start("ags", info->username, &conv, &pamh);
    if (retval == PAM_SUCCESS) {
        retval = pam_authenticate(pamh, 0);
        pam_end(pamh, retval);
    }
    if (retval != PAM_SUCCESS) {
        g_task_return_new_error(task, G_IO_ERROR, G_IO_ERROR_FAILED, "%s", pam_strerror(pamh, retval));
    }
    else {
        g_task_return_int(task, retval);
    }
}

/**
 * gutils_authenticate_user:
 * @username: the username for which the password to be authenticated
 * @password: the password to be authenticated
 * @io_priority: the [I/O priority][io-priority] of the request
 * @cancellable: (nullable): optional #GCancellable object,
 *   %NULL to ignore
 * @callback: (scope async) (closure user_data): a #GAsyncReadyCallback
 *   to call when the request is satisfied
 * @user_data: the data to pass to callback function
 *
 * Requests authentication of the provided password for the specified username using the PAM (Pluggable Authentication Modules) system.
 */
void gutils_authenticate_user (const gchar*         username,
                               const gchar*         password,
                               int                  io_priority,
                               GCancellable        *cancellable,
                               GAsyncReadyCallback  callback,
                               gpointer             user_data) {
    auth_info *info = (auth_info *) malloc(sizeof(auth_info));
    if (info == NULL) return;
    info->username = strdup(username);
    info->password = strdup(password);

    GTask *task;
    task = g_task_new (NULL, cancellable, callback, user_data);
    g_task_set_task_data(task, info, free_auth_info);
    g_task_set_priority(task, io_priority);
    g_task_run_in_thread(task, auth_thread);
    g_object_unref (task);
}

int gutils_authenticate_user_finish(GAsyncResult  *res,
                                    GError       **error) {
    return g_task_propagate_int(G_TASK(res), error) ;
}

/**
 * gutils_authenticate:
 * @password: the password to be authenticated
 * @io_priority: the [I/O priority][io-priority] of the request
 * @cancellable: (nullable): optional #GCancellable object,
 *   %NULL to ignore
 * @callback: (scope async) (closure user_data): a #GAsyncReadyCallback
 *   to call when the request is satisfied
 * @user_data: the data to pass to callback function
 *
 * Requests authentication of the provided password using the PAM (Pluggable Authentication Modules) system.
 */
void gutils_authenticate (const gchar*         password,
                          int                  io_priority,
                          GCancellable        *cancellable,
                          GAsyncReadyCallback  callback,
                          gpointer             user_data) {
    struct passwd *passwd = getpwuid(getuid());
    char *username = passwd->pw_name;

    return gutils_authenticate_user(username, password, io_priority, cancellable, callback, user_data);
}

int gutils_authenticate_finish(GAsyncResult  *res,
                               GError       **error){
    return g_task_propagate_int(G_TASK(res), error) ;
}
