// Scope Mini CRM: Service Worker for Web Push Notifications
// Specifications: §18.7, Task 4.16

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'Scope Mini CRM';
    const options = {
      body: data.body || 'تنبيه جديد من النظام',
      icon: '/icon-192.png',
      badge: '/badge-72.png',
      dir: 'rtl',
      lang: 'ar',
      tag: data.tag || 'scope-crm-notification',
      data: {
        url: data.url || '/data/backups',
      },
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    // Ignore push notification parsing errors
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/data/backups';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus existing tab if open
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
