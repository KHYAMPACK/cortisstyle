/* Push-only service worker for Butik Paneli (no offline asset cache). */

const PANEL_HOME = "/tr/panel";
const ORDERS_PATH = "/tr/panel/siparisler";

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(Promise.resolve());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  event.waitUntil(
    (async () => {
      let title = "Yeni sipariş";
      let body = "Mağazanıza yeni bir sipariş geldi.";
      let url = ORDERS_PATH;

      try {
        if (event.data) {
          const parsed = event.data.json();
          if (typeof parsed.title === "string" && parsed.title.trim()) {
            title = parsed.title;
          }
          if (typeof parsed.body === "string" && parsed.body.trim()) {
            body = parsed.body;
          }
          if (typeof parsed.url === "string" && parsed.url.trim()) {
            url = parsed.url;
          } else if (
            parsed.data &&
            typeof parsed.data.url === "string" &&
            parsed.data.url.trim()
          ) {
            url = parsed.data.url;
          }
        }
      } catch {
        try {
          const text = event.data && event.data.text && event.data.text();
          if (text) body = text;
        } catch {
          /* defaults */
        }
      }

      await self.registration.showNotification(title, {
        body,
        icon: "/brand/cortisstyle-favicon.png",
        badge: "/brand/cortisstyle-favicon.png",
        data: { url },
        tag: "tr-panel-new-order",
        renotify: true,
        // Helps some Android builds surface the alert promptly.
        requireInteraction: false,
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawPath =
    (event.notification.data && event.notification.data.url) || ORDERS_PATH;
  const ordersUrl = new URL(
    typeof rawPath === "string" ? rawPath : ORDERS_PATH,
    self.location.origin,
  );
  if (!ordersUrl.pathname.startsWith(PANEL_HOME)) {
    ordersUrl.pathname = ORDERS_PATH;
  } else if (
    ordersUrl.pathname === PANEL_HOME ||
    ordersUrl.pathname === `${PANEL_HOME}/`
  ) {
    ordersUrl.pathname = ORDERS_PATH;
  }
  const targetHref = ordersUrl.href;
  const targetPath = `${ordersUrl.pathname}${ordersUrl.search}${ordersUrl.hash}`;

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of allClients) {
        const isPanel =
          typeof client.url === "string" && client.url.includes("/tr/panel");
        if (!isPanel || !("focus" in client)) continue;

        await client.focus();
        try {
          client.postMessage({
            type: "tr-panel-open-siparisler",
            url: targetPath,
          });
        } catch {
          /* ignore */
        }
        if ("navigate" in client) {
          try {
            await client.navigate(targetHref);
          } catch {
            /* ignore */
          }
        }
        return;
      }

      if (self.clients.openWindow) {
        await self.clients.openWindow(targetHref);
      }
    })(),
  );
});
