import { notifications } from '@mantine/notifications'

export function showErrorNotification(title: string, message: string) {
  notifications.show({
    title,
    message,
    color: 'red',
  })
}

export function showSuccessNotification(title: string, message: string) {
  notifications.show({
    title,
    message,
    color: 'green',
  })
}

export function showWarningNotification(title: string, message: string) {
  notifications.show({
    title,
    message,
    color: 'yellow',
  })
}

export function showClipboardUnavailableNotification() {
  showErrorNotification('Clipboard unavailable', 'Clipboard runtime is not available.')
}

export function showClipboardEmptyNotification() {
  showWarningNotification('Clipboard is empty', 'Nothing to paste.')
}
