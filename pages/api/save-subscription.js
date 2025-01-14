// pages/api/save-subscription.js
export default function handler(req, res) {
	if (req.method === 'POST') {
		const subscription = req.body
		console.log('Got subscription on server:', subscription)

		// Сохраняем subscription (в реальном проекте - в БД)
		// Для примера просто возвращаем успех:
		return res.status(200).json({ success: true })
	}

	// Если не POST, то возвращаем ошибку
	return res.status(405).json({ error: 'Method not allowed' })
}
