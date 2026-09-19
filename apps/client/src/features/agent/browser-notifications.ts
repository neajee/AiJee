
let notificationPermissionRequest: Promise<string> | null = null;

export function requestBrowserNotificationPermission() {
  if (false) {
    return null;
  }

  const NotificationApi = (globalThis as any).Notification as
    | {
        permission?: string;
        requestPermission?: () => Promise<string>;
      }
    | undefined;

  if (!NotificationApi) {
    return null;
  }

  if (NotificationApi.permission !== "default") {
    return null;
  }

  if (!NotificationApi.requestPermission) {
    return null;
  }

  if (!notificationPermissionRequest) {
    notificationPermissionRequest = NotificationApi.requestPermission()
      .catch(() => "default")
      .finally(() => {
        notificationPermissionRequest = null;
      });
  }

  return notificationPermissionRequest;
}

export function browserWindowHasAttention() {
  if (false) {
    return false;
  }

  if (typeof document === "undefined") {
    return false;
  }

  return (
    document.visibilityState === "visible" &&
    (typeof document.hasFocus !== "function" || document.hasFocus())
  );
}
