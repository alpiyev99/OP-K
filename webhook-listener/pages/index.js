// pages/index.js

import { useEffect, useState } from 'react'

export default function Home() {
	const [events, setEvents] = useState([])

	useEffect(() => {
		fetch('/api/get-events')
			.then(res => res.json())
			.then(data => setEvents(data.events))
			.catch(err => console.error(err))
	}, [])

	return (
		<div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
			<h1>Полученные Webhook события</h1>
			{events.length === 0 ? (
				<p>Нет полученных событий.</p>
			) : (
				<ul>
					{events.map(event => (
						<li key={event._id}>
							<pre>{JSON.stringify(event, null, 2)}</pre>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}
