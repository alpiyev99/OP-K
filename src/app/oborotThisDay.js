// Файл: src/app/oborotThisDay.js
import * as dotenv from 'dotenv'
dotenv.config() // Загрузка переменных окружения из .env

import fetch from 'node-fetch' // Если Node < 18. В Node >=18 можно использовать встроенный fetch
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// ----------------------------------------------------------------------------
// Получаем __dirname в ESM окружении (по умолчанию __dirname не доступен)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ----------------------------------------------------------------------------
// 1. Читаем переменные окружения
const credentials = process.env.CREDENTIALS
if (!credentials) {
	throw new Error('CREDENTIALS is undefined. Проверьте .env файл!')
}
const encodedCredentials = Buffer.from(credentials).toString('base64')

// ----------------------------------------------------------------------------
// 2. Собираем URL для запроса к MoySklad
const apiUrlBuilder = {
	uri: 'https://api.moysklad.ru/api/remap/1.2/',
	addField: function (...fields) {
		return `${this.uri}${fields.join('/')}`
	},
}

// Текущая дата
const now = new Date()
const year = now.getFullYear()
const month = String(now.getMonth() + 1).padStart(2, '0')
const day = String(now.getDate()).padStart(2, '0')

// Диапазон дат за сегодняшний день
const momentFrom = `${year}-${month}-${day} 00:00:00`
const momentTo = `${year}-${month}-${day} 23:59:59`

// Пример: report/turnover/all?momentFrom=...&momentTo=...
const endpoint = `report/turnover/all?momentFrom=${momentFrom}&momentTo=${momentTo}`
const urlRes = apiUrlBuilder.addField(endpoint)

console.log('Request URL:', urlRes)

// ----------------------------------------------------------------------------
// 3. Делаем запрос к API
try {
	const response = await fetch(urlRes, {
		method: 'GET',
		headers: {
			Authorization: 'Basic ' + encodedCredentials,
			'Content-Type': 'application/json',
			Accept: 'application/json;charset=utf-8',
		},
	})

	if (!response.ok) {
		const text = await response.text()
		throw new Error(`HTTP error! Status: ${response.status}\nMessage: ${text}`)
	}

	const data = await response.json()
	console.log('Response data:', data)

	// ----------------------------------------------------------------------------
	// 4. Сохраняем ответ в public/oborotThisDay.json
	// Используем path.resolve для корректного пути из src/app в public
	// Нужно подняться на 2 уровня выше (из app в src, потом в корень), а затем в public:
	const filePath = resolve(__dirname, '../../public/oborotThisDay.json')

	await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
	console.log('Данные успешно сохранены в файл:', filePath)
} catch (error) {
	console.error('Error:', error)
}
