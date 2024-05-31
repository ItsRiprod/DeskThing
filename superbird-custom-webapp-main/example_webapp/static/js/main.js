/* We need to connect to the internal websocket, else the cat thing kills the webview */
const socket = new WebSocket('ws://localhost:8890');


/* Put your code below this line :) */

const content = document.getElementById('content');

function setTime() {
	const time = new Date().toISOString();
	content.innerHTML = `Congratulations, you are running a custom webapp on your car thing.<p/>The current time is ${time}`
	setTimeout(setTime, 100);
}
setTime()

