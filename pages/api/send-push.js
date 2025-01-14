// pages/api/send-push.js (Next.js до 13.2)
// или app/api/send-push/route.js (Next.js 13+)

import webpush from 'web-push'

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		return res.status(405).json({ error: 'Method not allowed' })
	}

	// Настраиваем VAPID (свои ключи)
	webpush.setVapidDetails(
		'mailto:admin@example.com',
		process.env.VAPID_PUBLIC_KEY, // Public
		process.env.VAPID_PRIVATE_KEY // Private
	)

	try {
		// Разбираем тело запроса
		const { subscription, items } = req.body
		// subscription — это то, что получаем из pushManager (endpoint, keys)
		// items — список новых товаров, о которых хотим уведомить

		// Формируем payload (что будем отправлять)
		const payload = JSON.stringify({
			title: 'Низкий запас товара',
			body:
				items && items.length
					? `Товары: ${items.join(', ')}`
					: 'Нечего показывать',
			icon: 'https://via.placeholder.com/100',
		})

		// Отправляем пуш
		await webpush.sendNotification(subscription, payload)

		return res.status(200).json({ success: true })
	} catch (error) {
		console.error('Error sending push:', error)
		return res.status(500).json({ error: 'Error sending push' })
	}
}
