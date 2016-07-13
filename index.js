var raspi = require('raspi-io');
var five = require('johnny-five');
var w1bus = require('node-w1bus');
var AWS = require ('aws-sdk');
AWS.config.region = 'eu-west-1';
var fs = require('fs');

// Camera stuff
var RaspiCam = require("raspicam");
var camera = new RaspiCam({ mode:"photo", output:"testfile%d.jpg", width: 1920, height: 1080 });

// AWS IoT stuff
const deviceModule = require('./device');

const certPath = "/home/pi/Downloads/";

const device = deviceModule({
  region: 'eu-west-1',
  protocol: 'mqtts',
  clientId: "raspberry_pi",
  keyPath: certPath + 'private.pem.key',
  certPath: certPath + 'certificate.pem.crt',
  caPath: certPath + 'root-CA.crt',
  testMode: 1,
  baseReconnectTimeMs: 4000,
  keepalive: 30,
  delay: 4000,
  debug: false
});

device.subscribe('camera_aim');
device.subscribe('camera_shutter');

// Initialise Johnny Five
var board = new five.Board({
  io: new raspi()
});

var bus = w1bus.create();

// When board has initialised
board.on('ready', function() {
  // define Johnny Five devices and their pin mappings
  var led = new five.Led('GPIO25');

  var button = new five.Button({pin: "GPIO17", isPullup: true});

  var yservo = new five.Servo({pin: "GPIO18",
    center: true
  });

  var xservo = new five.Servo({ pin: "GPIO19",
    center: true
  });

  button.on("down", function () {
    console.log("down");
    led.toggle();
    device.publish('button', JSON.stringify({
      state: "down"
    }));
  });

  button.on("up", function() {
    console.log("up");
    device.publish('button', JSON.stringify({
      state: "up"
    }));
  });

  // Makes servo objects available in REPL
  this.repl.inject({
    xservo: xservo,
    yservo: yservo
  });

  // Publishes the temperature read from all connected One Wire devices to AWS IoT
  function uploadTemperature() {
    bus.listAllSensors().then(function(data){
      data.ids.map(function(id) {
        bus.getValueFrom(id, "temperature").then(function(res) {
          device.publish('temperature', JSON.stringify({
            sensor_id: id,
            data: res
          }));
        });
      });
    });
    setTimeout(uploadTemperature, 5000);
  }
  uploadTemperature();

  // Fires when the camera saves file, uploads image to S3
  camera.on("read", function(err, timestamp, filename){
    if (filename.endsWith("jpg")) {
      console.log(filename);
      var body = fs.createReadStream(filename);
      var s3obj = new AWS.S3({params: {Bucket: 'iot.maidavale.org', Key: timestamp + ".jpg"}});
      s3obj.upload({Body: body}).
        on('httpUploadProgress', function(evt) { console.log(evt); }).
        send(function(err, data) { console.log(err, data) });
    }
  });

  // When message received on subscribed topic from AWS IoT
  device.on('message', function(topic, payload) {
    const message = JSON.parse(payload);
    switch(topic) {
      case "camera_aim": {
        console.log(message.x);
        console.log(typeof(message.x));
        console.log(message.y);
        xservo.to(message.x, 500);
        yservo.to(message.y, 500);
        break;
      }
      case "camera_shutter": {
        camera.start();
      }
    }
    console.log('message', topic, payload.toString());
  });
});

// Logging for AWS IoT events
device.on('connect', function() {
  console.log('connect');
});

device.on('close', function() {
  console.log('close');
});

device.on('reconnect', function() {
  console.log('reconnect');
});

device.on('offline', function() {
  console.log('offline');
});

device.on('error', function(error) {
  console.log('error', error);
});
