// pages/api/webhook.js

import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
const options = {
	useNewUrlParser: true,
	useUnifiedTopology: true,
}

let client
let clientPromise

if (!process.env.MONGODB_URI) {
	throw new Error('Please add your Mongo URI to .env.local')
}

if (process.env.NODE_ENV === 'development') {
	if (!global._mongoClientPromise) {
		client = new MongoClient(uri, options)
		global._mongoClientPromise = client.connect()
	}
	clientPromise = global._mongoClientPromise
} else {
	client = new MongoClient(uri, options)
	clientPromise = client.connect()
}

export default async function handler(req, res) {
	if (req.method === 'POST') {
		const data = req.body

		try {
			const client = await clientPromise
			const db = client.db('webhooks')
			const collection = db.collection('events')

			const result = await collection.insertOne({
				...data,
				receivedAt: new Date(),
			})

			res
				.status(200)
				.json({ message: 'Webhook received', id: result.insertedId })
		} catch (error) {
			console.error(error)
			res.status(500).json({ error: 'Failed to save webhook data' })
		}
	} else {
		res.setHeader('Allow', ['POST'])
		res.status(405).end(`Method ${req.method} Not Allowed`)
	}
}
