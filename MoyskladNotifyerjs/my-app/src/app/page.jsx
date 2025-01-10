'use client'
// Директива необходима для Next.js 13, чтобы код исполнялся на клиенте

import { useEffect, useState } from 'react'

export default function HomePage() {
	const [status, setStatus] = useState('Проверка инвентаря...')

	useEffect(() => {
		// Проверяем, есть ли window (на сервере его нет)
		if (typeof window === 'undefined') return

		// Проверяем поддержку Notification API
		if (!('Notification' in window)) {
			setStatus('Push уведомления не поддерживаются вашим браузером.')
			return
		}

		// Запрашиваем разрешение на отправку уведомлений
		Notification.requestPermission().then(permission => {
			if (permission === 'granted') {
				fetchDataAndNotify()
			} else {
				setStatus('Разрешение на отправку уведомлений отклонено.')
			}
		})

		async function fetchDataAndNotify() {
			try {
				// Запрос к /public/oborotThisDay.json
				const response = await fetch('/oborotThisDay.json')
				if (!response.ok) {
					throw new Error(`Ошибка запроса: ${response.status}`)
				}
				const data = await response.json()

				// Получаем список уведомленных товаров из localStorage
				const stored = localStorage.getItem('notifiedItems')
				let notifiedItems = stored ? JSON.parse(stored) : []

				// Фильтруем товары с низким запасом (число < 10)
				const lowStockItems = data.rows.filter(item => {
					// подстраховка, если onPeriodEnd нет
					return item.onPeriodEnd && item.onPeriodEnd.quantity < 10
				})

				// Находим те товары, которых нет в notifiedItems
				const newItemsToNotify = lowStockItems.filter(item => {
					return !notifiedItems.includes(item.assortment.name)
				})

				if (newItemsToNotify.length > 0) {
					// Отправляем уведомления
					newItemsToNotify.forEach(item => {
						new Notification('Низкий запас товара', {
							body: `${item.assortment.name} осталось ${item.onPeriodEnd.quantity} шт.`,
							icon: 'https://via.placeholder.com/100', // замените на свой URL иконки
						})
					})

					// Обновляем список уведомленных товаров
					notifiedItems = [
						...notifiedItems,
						...newItemsToNotify.map(item => item.assortment.name),
					]
					localStorage.setItem('notifiedItems', JSON.stringify(notifiedItems))

					setStatus(
						'Уведомления отправлены для новых товаров с низким запасом.'
					)
				} else {
					setStatus('Новых товаров с низким запасом нет.')
				}
			} catch (error) {
				console.error('Ошибка при проверке запасов:', error)
				setStatus('Ошибка при проверке запасов.')
			}
		}
	}, [])

	return (
		<main>
			<h1>Inventory Check</h1>
			<p>{status}</p>
		</main>
	)
}
