self.addEventListener("push", (event) => {
    if (!event.data) return;

    let payload = {};

    try {
        payload = event.data.json();
    } catch {
        payload = {
            title: "NexTalk",
            body: event.data.text(),
        };
    }

    const title = payload.title || "NexTalk";
    const options = {
        body: payload.body || "You have a new notification",
        data: payload.data || { url: "/" },
        tag: payload.data?.notificationId || "NexTalk-notification",
        renotify: true,
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    const targetUrl = event.notification?.data?.url || "/";

    event.waitUntil(
        clients.matchAll({
            type: "window",
            includeUncontrolled: true,
        }).then((clientList) => {
            const target = new URL(targetUrl, self.location.origin).href;

            for (const client of clientList) {
                if ("focus" in client) {
                    return client.focus().then(() => {
                        if ("navigate" in client) {
                            return client.navigate(target);
                        }
                    });
                }
            }

            return clients.openWindow(target);
        })
    );
});
