var raspi = require('raspi-io');
var five = require('johnny-five');
var board = new five.Board({
  io: new raspi()
});

var button;

board.on('ready', function() {
		////board.digitalWrite("GPIO18", 1);
	//board.pinMode("GPIO18", five.Pin.INPUT);
	//board.digitalWrite("GPIO18", 1);
  // Create an Led on pin 7 on P1 (GPIO4)
  // and strobe it on/off
  var led = new five.Led('GPIO4');
  led.strobe(500);
  
  button = new five.Button({pin: "GPIO17", isPullup: true});
  
  var servo = new five.Servo("GPIO18");
  servo.sweep();

  var servo2 = new five.Servo("GPIO12");
  servo2.sweep();
  
  button.on("down", function () {
	console.log("down");
  });
  
  button.on("up", function() {
	  console.log("up");
  });
});

