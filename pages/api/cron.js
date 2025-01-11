// pages/api/cron.js
import { NextApiRequest, NextApiResponse } from 'next'
import oborotThisDay from '../../src/app/oborotThisDay'

export default async function handler(req, res) {
	try {
		// Run the logic from oborotThisDay.js
		await oborotThisDay()
		return res.status(200).json({ success: true })
	} catch (error) {
		console.error(error)
		return res.status(500).json({ success: false, error: error.message })
	}
}
