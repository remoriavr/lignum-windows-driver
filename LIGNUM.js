 var static = require('node-static');
 var NobleDevice = require('noble-device');
 var events = require('events');
 var util = require('util');
 var http = require('http');

 var LIGNUM_SERVICE_UUID = '6e400001b5a3f393e0a9e50e24dcca9e';
 var LIGNUM_NOTIFY_CHAR  = '6e400003b5a3f393e0a9e50e24dcca9e';
 var LIGNUM_WRITE_CHAR   = '6e400002b5a3f393e0a9e50e24dcca9e';

 var nrfuart = function(peripheral)
 {
     // call nobles super constructor
     NobleDevice.call(this, peripheral);
     // setup or do anything else your module needs here
 };

 // tell Noble about the service uuid(s) your peripheral advertises (optional)
 nrfuart.SCAN_UUIDS = [LIGNUM_SERVICE_UUID];

 util.inherits(nrfuart, events.EventEmitter);

 // and/or specify method to check peripheral (optional)
 nrfuart.is = function(peripheral)
 {
     'use strict';
     //return (peripheral.advertisement.localName === 'UART');
     return true;
 };

 // inherit noble device
 NobleDevice.Util.inherits(nrfuart, NobleDevice);

 // Receive data using the 'data' event.
 nrfuart.prototype.onData = function(data)
 {
     'use strict';
     this.emit("data", data);
 };

 // Send data like this
 // nrfuart.write('Hello world!\r\n', function(){...});
 // or this
 // nrfuart.write([0x02, 0x12, 0x34, 0x03], function(){...});
 nrfuart.prototype.write = function(data, done)
 {
     'use strict';
     if (typeof data === 'string')
         this.writeDataCharacteristic(LIGNUM_SERVICE_UUID, LIGNUM_WRITE_CHAR, new Buffer(data), done);
     else
         this.writeDataCharacteristic(LIGNUM_SERVICE_UUID, LIGNUM_WRITE_CHAR, data, done);
 };

 nrfuart.prototype.connectAndSetup = function(callback)
 {
     'use strict';
     var self = this;
     NobleDevice.prototype.connectAndSetup.call(self, function()
     {
       self.notifyCharacteristic(LIGNUM_SERVICE_UUID,LIGNUM_NOTIFY_CHAR, true, self.onData.bind(self), callback);
     });
 };

// export device
module.exports = nrfuart;
// script info
console.log('Author: Remoria VR');
console.log('Description: LIGNUM Controller Bluetooth LE Driver');
console.log('Script: LIGNUM.js');
console.log('Author: Matteo Pisani');
console.log('Version: 1.0');
console.log('Updated: 03 august 2016');

var server = http.createServer(function (req, res)
{
  res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Request-Method', '*');
	res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
	res.setHeader('Access-Control-Allow-Headers', '*');
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end(response);
})
server.listen(5191, '127.0.0.1');
console.log('Status: Running driver host at http://127.0.0.1:5191/');

console.log('Status: Running driver sandbox at http://127.0.0.1:1915/');
var file = new static.Server('./server');
require('http').createServer(function (request, response)
{
    request.addListener('end', function ()
    {
        file.serve(request, response);
    }).resume();
}).listen(1915);
console.log('Status: Connecting to LIGNUM Controller. Wait...');
packet = "";
response = "";
nrfuart.discoverAll(function(ble_uart)
{
    'use strict';
    // enable disconnect notifications
    ble_uart.on('disconnect', function()
	  {
      console.log('Status: LIGNUM Controller Disconnected.');
    });

    // connect and setup
    ble_uart.connectAndSetup(function()
	  {
      console.log('Status: LIGNUM Controller Connected.');
      //ble_uart.readDeviceName(function(devName)
		  //{
      //  console.log('Device name:', devName);
      //});

      ble_uart.on('data', function(data)
		  {
        packet += data.toString();
        if(packet[packet.length-1]=="|")
        {
          response = packet.toString();
          console.log('received:', packet.toString());
          packet = "";
        }
      });
    });
});
