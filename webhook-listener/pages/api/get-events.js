// pages/api/get-events.js

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
	if (req.method === 'GET') {
		try {
			const client = await clientPromise
			const db = client.db('webhooks')
			const collection = db.collection('events')

			const events = await collection
				.find({})
				.sort({ receivedAt: -1 })
				.limit(100)
				.toArray()

			res.status(200).json({ events })
		} catch (error) {
			console.error(error)
			res.status(500).json({ error: 'Failed to fetch events' })
		}
	} else {
		res.setHeader('Allow', ['GET'])
		res.status(405).end(`Method ${req.method} Not Allowed`)
	}
}


