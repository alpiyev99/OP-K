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
	// Используем waitUntil для того, чтобы удерживать сервис-воркер активным
	// пока не будет показано уведомление
	event.waitUntil(self.registration.showNotification(data.title, options))
})
