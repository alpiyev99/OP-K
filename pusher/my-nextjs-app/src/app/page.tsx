'use client'
// Директива "use client" нужна, чтобы код выполнялся на клиентской стороне в Next.js 13

import { useEffect, useState } from 'react'

export default function HomePage() {
	const [status, setStatus] = useState('Проверка инвентаря...')

	useEffect(() => {
		// Проверка, поддерживает ли браузер Notifications API
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
				// Выполняем запрос к файлу из public/oborotThisDay.json
				const response = await fetch('/oborotThisDay.json')
				const data = await response.json()

				// Получаем список уведомленных товаров из localStorage
				let notifiedItems =
					JSON.parse(localStorage.getItem('notifiedItems')) || []

				// Фильтруем товары с низким запасом
				const lowStockItems = data.rows.filter(
					item => item.onPeriodEnd?.quantity < 10
				)

				// Находим новые товары, которых нет в списке notifiedItems
				const newItemsToNotify = lowStockItems.filter(
					item => !notifiedItems.includes(item.assortment.name)
				)

				if (newItemsToNotify.length > 0) {
					// Отправляем уведомления для каждого нового товара
					newItemsToNotify.forEach(({ assortment, onPeriodEnd }) => {
						new Notification('Низкий запас товара', {
							body: `${assortment.name} осталось ${onPeriodEnd.quantity} шт.`,
							icon: 'https://via.placeholder.com/100',
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
				console.error('Ошибка запроса:', error)
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
