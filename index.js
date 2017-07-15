const spawn = require('child_process').spawn;
const debounce = require('debounce');
const ndb = require('node-dash-button');
const moment = require('moment');

module.exports = (function() {
	let buttons = [];
	let processStartTime = null;

	let config = {
		iface: {
			arp: "eth0",
			tshark: 'wlan0'
		},
		channel: 7,
		timeout: 8000,
		listeners: {
			arp: true,
			tshark: true
		},
		debug: false
	}


	return {
		config: config,
		AddButton: (name, mac_address, callback) => {
			callback = debounce(callback, config.timeout, true);
			buttons.push({ name, mac_address, callback });
		},
		Listen: () => {
			if (!config.listeners.tshark && !config.listeners.arp) {
				throw new exception("You need to enable at least one listener (tshark or arp)");
			}

			if (config.listeners.tshark === true) {
				let processName = 'tshark';
				let args = ['-i', config.iface.tshark, '-l', '-T', 'fields', '-e', 'wlan.sa'];

				console.log("Launching " + processName);
				StartProcess(processName, args);
			}

			if (config.listeners.arp === true) {
				let macAddresses = buttons.map(b => b.mac_address);
				let dash = ndb(macAddresses, config.iface.arp, 0, 'all');
				dash.on('detected', HandleArpDetected);

				console.log('Listening for dash buttons via ARP/UDP...');
			}

		}
	}

	function HandleTsharkOutput(data) {
		if (data.toString().length === 0) {
			return;
		}

		// Split lines
		let lines = data.toString().split('\n');

		// Get rid of empty lines
		lines = lines.filter(l => l.length > 0);

		lines.forEach(line => {
			// Make sure we only have a MAC address
			let macMatches = /([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/.exec(line);
			if (macMatches != null && macMatches.length > 1) {
				// See if an of our buttons have this MAC address
				let button = buttons.find(b => b.mac_address.toLowerCase() === macMatches[1].toLowerCase());

				if (button) {
					// Button press detected!
					if (config.debug) {
						console.log(Timestamp(), `Detected ${button.name} via Tshark`);
					}
					button.callback(button);
				}
			}
		});
	}

	function HandleArpDetected(mac) {
		let button = buttons.find(b => b.mac_address === mac);
		if (button) {
			if (console.debug) {
				console.log(Timestamp(), `Detected ${button.name} via ARP/UDP`);
			}
			button.callback(button);
		}
	}

	function StartProcess(name, args) {
		processStartTime = new Date();


		let process = spawn(name, args);

		process.stdout.on('data', function(data) { HandleTsharkOutput(data); });
		process.stderr.on('data', function(data) { HandleTsharkOutput(data); });

		process.on('close', function(code) {
			// If the process was up for less than 5 seconds, show some info for troubleshooting
			if (console.debug || processStartTime - new Date() <= 5000) {
				console.log();
				console.log(Timestamp(), 'Monitor process ended! Button presses will not be detected. Code: ' + code);
				console.log();
				console.log("Try running the command to troubleshoot (check configuration, etc):");

				let commandStr = `${name} ${args.join(' ')}`;
				console.log(commandStr);

			} else {
				// If it was up for more than 5 seconds, restart it
				console.log(Timestamp(), "Monitor process ended. Restarting...");
				return StartProcess(name, args);
			}
		});
	}

	function Timestamp() {
		return moment().format("M/D hh:mm:ss a") + ": ";
	}

})();


