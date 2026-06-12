import ChibiClient from "./structures/Client";
import { startServer } from "./server";

const client = new ChibiClient();
client.start();

// Start the dashboard API server after the bot connects
// The server shares the bot's Redis instance for session storage
client.once("clientReady", () => {
    startServer(client.redis);
});