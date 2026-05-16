export default async function handler(req, res) {

    try {

        const response = await fetch(
            "https://onesignal.com/api/v1/players?app_id=10fd0812-370f-408a-9ea5-cbb349f5d635&limit=300",
            {
                headers: {
                    Authorization: `Basic ${process.env.ONESIGNAL_REST_KEY}`
                }
            }
        );

        const data = await response.json();

        const ativos = data.players.filter(
            p => p.invalid_identifier !== true &&
                 p.notification_types > 0
        );

        res.status(200).json({
            total: ativos.length
        });

    } catch (e) {

        res.status(500).json({
            error: e.message
        });

    }
}
