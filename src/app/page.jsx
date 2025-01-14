// /app/app.jsx

'use client'
import { useState, useEffect } from 'react'

export default function HomePage() {
	const [status, setStatus] = useState('Проверка инвентаря...')

	useEffect(() => {
		if (!('serviceWorker' in navigator)) {
			console.log('Service Worker not supported in this browser.')
			setStatus('Ваш браузер не поддерживает Service Worker.')
			return
		}

		navigator.serviceWorker
			.register('/sw.js')
			.then(async registration => {
				console.log('Service Worker registered:', registration)

				// Запрашиваем разрешение у пользователя
				const permission = await Notification.requestPermission()
				if (permission !== 'granted') {
					console.log('Пользователь не разрешил пуш-уведомления.')
					setStatus('Пользователь не разрешил пуши.')
					return
				}

				// Если разрешил, получаем подписку (если нет — создаём)
				let subscription = await registration.pushManager.getSubscription()
				if (!subscription) {
					// Если ещё нет подписки, подписываемся
					subscription = await registration.pushManager.subscribe({
						userVisibleOnly: true,
						applicationServerKey: urlBase64ToUint8Array('BH58h85YOHvhdo0m3TBNrcf3RVgVV3SrLIX-dbbtXIs9FBH7I6tQSJkC0TzelDRms0tEOCVSFiFqKSo-ekg3JDA'),
					})
				}

				// Вызовем функцию проверки запасов (и при необходимости отправим пуш)
				fetchDataAndNotify(subscription)
			})
			.catch(err => {
				console.error('Service Worker registration failed:', err)
				setStatus('Ошибка при регистрации сервис-воркера.')
			})
	}, [])

	// Функция, которая берёт данные о запасах, показывает локальные уведомления
	// и (важно) отправляет PUSH через /api/send-push, если нужно
	async function fetchDataAndNotify(subscription) {
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
				return item.onPeriodEnd && item.onPeriodEnd.quantity < 10
			})

			// Находим те товары, которых нет в notifiedItems
			const newItemsToNotify = lowStockItems.filter(item => {
				return !notifiedItems.includes(item.assortment.name)
			})

			if (newItemsToNotify.length > 0) {
				// 1. Локальные уведомления (видны, пока страница открыта)
				newItemsToNotify.forEach(item => {
					new Notification('Низкий запас товара', {
						body: `${item.assortment.name} осталось ${item.onPeriodEnd.quantity} шт.`,
						icon: 'https://via.placeholder.com/100',
					})
				})

				// 2. Настоящий PUSH через сервер (чтобы пришло даже при закрытом браузере)
				const newItemsNames = newItemsToNotify.map(item => item.assortment.name)

				// Посылаем данные на сервер
				await fetch('/api/send-push', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						subscription: subscription, // подписка
						items: newItemsNames, // список товаров для payload
					}),
				})

				// Обновляем список уже уведомленных товаров
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

	return (
		<main>
			<h1>Inventory Check (No DB)</h1>
			<p>{status}</p>
		</main>
	)
}

/**
 * Функция для конвертации Base64 -> Uint8Array
 */
function urlBase64ToUint8Array(base64String) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
	const rawData = atob(base64)
	return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)))
}