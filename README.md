# node-dash-button-mon

[![NPM](https://nodei.co/npm/node-dash-button-mon.png?compact=true)](https://www.npmjs.com/package/node-dash-button-mon)

node-dash-button-mon is a library for detecting Amazon Dash button presses.

**Note:** If your WiFi adapter can't do monitor mode, use [this project by hortinstein](https://github.com/hortinstein/node-dash-button) instead.

_node-dash-button-mon_ allows you to detect dash presses by listening to WiFi frames via a wireless adapter in monitor mode (using tshark). This generally results in a faster response time since those can be picked up before the button fully connects to your wireless network.

I've noticed that from time to time tshark won't pick up a button press (the MAC address just never shows up in the output). Because of this, it'll use the ARP method as a fallback. You can only use both methods if you have two network adapters (ethernet + wifi, or 2x wifi). This is because a wireless adapter in monitor mode can't listen to ARP requests since it needs to be connected to your network.

Credit to [hortinstein's node-dash-button](https://github.com/hortinstein/node-dash-button) project for the ARP detection method.

**Not all wireless adapters can do monitor mode, so make sure yours can.** 

_I was able to get the built-in wireless adapter on the Raspberry Pi 3 into monitor mode using [this project](https://github.com/seemoo-lab/nexmon). Once the firmware was installed, I put the adapter in Monitor mode using `nexutil -m`._

#### Prerequisites
* tshark
* libpcap-dev
* WiFi adapter in "monitor" mode

_Mode should say "Monitor" in `iwconfig`_
```
pi@raspberrypi:~ $ iwconfig
wlan0     IEEE 802.11  Mode:Monitor  Frequency:2.442 GHz  Tx-Power=31 dBm   
          Retry short limit:7   RTS thr:off   Fragment thr:off
          Power Management:on
```

### Installation
```
apt install tshark
apt install libpcap-dev
npm install node-dash-button-mon
```

### Usage
```
let dash = require('node-dash-button-mon');

// Configuration
dash.config.iface.tshark   = "wlan0"; // wifi adapter in monitor mode
dash.config.iface.arp      = "eth0";  // ethernet adapter (can't be the same as the wifi adapter in monitor mode)
dash.config.timeout        = 8000;    // Don't run more than once in 8 seconds

let PotatoButton = {
	name: "Potato";
	mac: "8c:89:a5:1c:70:72"
}

// call AddButton for any buttons you have
dash.AddButton(PotatoButton.name, PotatoButton.mac, (button) => {
	console.log(`${button.name} button pressed!`);
	console.log(`MAC: ${button.mac}`);
});

dash.Listen();
```

### Configuration
```
dash.config.iface.tshark
string (default: 'wlan0') Wireless adapter in monitor mode to use with tshark

dash.config.iface.arp
string (default: 'eth0') Network adapter to use for listening to ARP requests (can't be the same as tshark adapter)

dash.config.timeout
int (default: 8000): Timeout between button presses (debounces the callback functions)

dash.config.debug
bool (default: false): Show additional console logs

dash.config.listeners.arp
bool (default: true): Listen to ARP requests

dash.config.listeners.tshark
bool (default: true): Use tshark to listen to wifi frames
```

### Troubleshooting
Make sure you can run tshark from the console:

```tshark -i wlan0 -l -T fields -e wlan.sa```


### Contributions
Pull requests welcome!
