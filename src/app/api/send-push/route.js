export async function POST(req) {
	const { subscription, items } = await req.json()
	// Логика отправки push-уведомлений
	return new Response(JSON.stringify({ success: true }), { status: 200 })
}
