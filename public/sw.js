self.addEventListener('push', function (event) {
	if (event.data) {
		const data = event.data.json()
		// data.title, data.body, data.icon и т.д.
		event.waitUntil(
			self.registration.showNotification(data.title, {
				body: data.body,
				icon: data.icon || '/icon.png',
				// ...доп. настройки
			})
		)
	}
})

self.addEventListener('notificationclick', function (event) {
	event.notification.close()
	// Можно открыть вкладку/фокусировать приложение
	event.waitUntil(
		clients
			.matchAll({ type: 'window', includeUncontrolled: true })
			.then(clientList => {
				if (clientList.length > 0) {
					// Фокусируем первую открытую вкладку
					return clientList[0].focus()
				}
				// Или открываем новую вкладку, если ни одной нет
				return clients.openWindow('/')
			})
	)
})
