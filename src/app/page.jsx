// /app/page.jsx

'use client'

// Импортируем хуки useState и useEffect из библиотеки React
import { useState, useEffect } from 'react'

// Главная функция нашего компонента - это страница HomePage
export default function HomePage() {
	// Создаём состояние "status" с начальным значением "Проверка инвентаря..."
	const [status, setStatus] = useState('Проверка инвентаря...')

	// Хук useEffect срабатывает при загрузке страницы
	useEffect(() => {

		if (typeof window === 'undefined') return
		// Проверяем, поддерживает ли браузер Service Worker
		if (!('serviceWorker' in navigator)) {
			console.log('Service Worker not supported in this browser.')
			setStatus('Ваш браузер не поддерживает Service Worker.')
			return // Прекращаем выполнение, если не поддерживается
		}

		// Регистрируем Service Worker ("рабочий сервис") для работы с пуш-уведомлениями
		navigator.serviceWorker
			.register('/sw.js')
			.then(async registration => {
				console.log('Service Worker registered:', registration)

				// Запрашиваем у пользователя разрешение на отправку уведомлений
				const permission = await Notification.requestPermission()
				if (permission !== 'granted') {
					console.log('Пользователь не разрешил пуш-уведомления.')
					setStatus('Пользователь не разрешил пуши.')
					return
				}

				// Проверяем, есть ли уже подписка на пуш-уведомления
				let subscription = await registration.pushManager.getSubscription()
				if (!subscription) {
					// Если подписки нет, создаём её с параметрами
					subscription = await registration.pushManager.subscribe({
						userVisibleOnly: true, // Уведомления будут видны пользователю
						applicationServerKey: urlBase64ToUint8Array(
							'BH58h85YOHvhdo0m3TBNrcf3RVgVV3SrLIX-dbbtXIs9FBH7I6tQSJkC0TzelDRms0tEOCVSFiFqKSo-ekg3JDA'
						),
					})
				}

				// Вызываем функцию проверки запасов и отправки уведомлений
				fetchDataAndNotify(subscription)
			})
			.catch(err => {
				console.error('Service Worker registration failed:', err)
				setStatus('Ошибка при регистрации сервис-воркера.')
			})
	}, []) // Пустой массив зависимостей означает, что этот эффект выполнится один раз при загрузке страницы

	// Функция для проверки запасов и отправки уведомлений
	async function fetchDataAndNotify(subscription) {
		try {
			// Делаем запрос к файлу с данными о запасах
			const response = await fetch('/oborotThisDay.json')
			if (!response.ok) {
				throw new Error(`Ошибка запроса: ${response.status}`)
			}
			const data = await response.json() // Парсим ответ как JSON

			// Получаем уже уведомленные товары из localStorage
			const stored = localStorage.getItem('notifiedItems')
			let notifiedItems = stored ? JSON.parse(stored) : []

			// Фильтруем товары, у которых запас меньше 10 штук
			const lowStockItems = data.rows.filter(item => {
				return item.onPeriodEnd && item.onPeriodEnd.quantity < 10
			})

			// Находим товары, которые ещё не были уведомлены
			const newItemsToNotify = lowStockItems.filter(item => {
				return !notifiedItems.includes(item.assortment.name)
			})

			if (newItemsToNotify.length > 0) {
				// Создаём локальные уведомления для новых товаров с низким запасом
				newItemsToNotify.forEach(item => {
					new Notification('Низкий запас товара', {
						body: `${item.assortment.name} осталось ${item.onPeriodEnd.quantity} шт.`,
						icon: 'https://via.placeholder.com/100',
					})
				})

				// Отправляем PUSH-уведомления через сервер
				const newItemsNames = newItemsToNotify.map(item => item.assortment.name)
				await fetch('/api/send-push', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						subscription: subscription, // Подписка пользователя
						items: newItemsNames, // Список товаров для уведомления
					}),
				})

				// Обновляем список уведомленных товаров в localStorage
				notifiedItems = [...notifiedItems, ...newItemsNames]
				localStorage.setItem('notifiedItems', JSON.stringify(notifiedItems))

				setStatus('Уведомления отправлены (локально и через push).')
			} else {
				setStatus('Новых товаров с низким запасом нет.')
			}
		} catch (error) {
			console.error('Ошибка при проверке запасов:', error)
			setStatus('Ошибка при проверке запасов.')
		}
	}

	// Отображаем статус на странице
return (
	<main
		style={{
			display: 'flex',
			flexDirection: 'column', // Расположить элементы вертикально
			justifyContent: 'center',
			alignItems: 'center',
			height: '100vh',
			backgroundColor: '#000', // Черный фон для контраста
			color: '#fff', // Белый текст
			fontFamily: 'Arial, sans-serif', // Шрифт
			textAlign: 'center', // Центровка текста
		}}
	>
		<h1
			style={{
				fontSize: '3rem',
				margin: '0',
			}}
		>
			Inventory Check
		</h1>
		<p
			style={{
				fontSize: '1.5rem',
				marginTop: '10px',
				opacity: 0.8, // Полупрозрачный текст
			}}
		>
			{status}
		</p>
	</main>
);

/**
 * Функция для преобразования строки Base64 в Uint8Array,
 * что необходимо для создания подписки на пуш-уведомления
 */
function urlBase64ToUint8Array(base64String) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
	const rawData = atob(base64)
	return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}}
