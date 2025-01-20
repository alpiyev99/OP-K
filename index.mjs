// index.mjs
import 'dotenv/config' // Loads variables from .env into process.env
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import fetch from 'node-fetch' // or use global fetch in Node 18+
import { exec } from 'child_process'

// 1) Help Node handle __dirname with ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 2) Load environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID

async function runFileWithDelay() {
	const process = exec('node oborotThisDay.js')

	// Вывод логов процесса в консоль
	process.stdout.on('data', data => console.log(`Вывод: ${data}`))
	process.stderr.on('data', data => console.error(`Ошибка: ${data}`))

	console.log('Файл oborotThisDay.js запущен')

	// Ожидание 10 секунд
	await new Promise(resolve => setTimeout(resolve, 10000))
	console.log('Прошло 10 секунд, продолжаем выполнение...')
}
runFileWithDelay();

// 3) Check we have the required env vars
if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
	console.error('ERROR: Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env')
	process.exit(1)
}

// 4) Utility functions to read/write JSON files
function readJsonFile(filePath) {
	try {
		const data = fs.readFileSync(filePath, 'utf-8')
		return JSON.parse(data)
	} catch (err) {
		console.error('Error reading file:', filePath, err)
		return null
	}
}

function writeJsonFile(filePath, data) {
	try {
		fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
	} catch (err) {
		console.error('Error writing file:', filePath, err)
	}
}

// 5) Function to send Telegram message
async function sendTelegramMessage(text) {
	const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
	const body = {
		chat_id: TELEGRAM_CHAT_ID,
		text,
		parse_mode: 'Markdown', // or 'HTML'
	}

	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body),
	})

	if (!response.ok) {
		const errorBody = await response.text()
		throw new Error(`Telegram API error: ${errorBody}`)
	}
}

// 6) Main function
async function main() {
	// 6a) Build file paths
	const oborotFile = path.join(__dirname, 'oborotThisDay.json')
	const notifiedFile = path.join(__dirname, 'notifiedItems.json')

	// 6b) Read data
	const oborotData = readJsonFile(oborotFile) || { rows: [] }
	let notifiedItems = readJsonFile(notifiedFile) || []

	// 6c) Find items with < 10 quantity
	const lowStockItems = oborotData.rows.filter(
		item => item?.onPeriodEnd?.quantity < 10
	)

	// 6d) Filter out items already notified
	const newItemsToNotify = lowStockItems.filter(
		item => !notifiedItems.includes(item.assortment.name)
	)

	if (newItemsToNotify.length > 0) {
		// Build message text
		const itemsText = newItemsToNotify
			.map(
				item =>
					`• ${item.assortment.name} осталось ${item.onPeriodEnd.quantity} шт.`
			)
			.join('\n')

		try {
			// 6e) Send Telegram message
			await sendTelegramMessage(`Низкий запас товаров:\n${itemsText}`)
			console.log('Telegram message sent successfully!')

			// 6f) Update notifiedItems.json
			const newNames = newItemsToNotify.map(i => i.assortment.name)
			notifiedItems = [...notifiedItems, ...newNames]
			writeJsonFile(notifiedFile, notifiedItems)
		} catch (err) {
			console.error('Error sending message to Telegram:', err)
		}
	} else {
		console.log('No new items with low stock.')
	}
}

// 7) Actually run `main()`
console.log('Starting script...')
await main()
console.log('Finishing script...')
