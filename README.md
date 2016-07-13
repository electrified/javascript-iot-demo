# Very rough demo of AWS IoT/ Johnny Five/ One Wire Bus on the Raspberry Pi

## Overview
Runs on Raspberry Pi with camera board mounted on pan/tilt, 
with connected DS18b20 One Wire temperature sensor, button and LED

Can remotely control camera pan/tilt, take photos and upload them to S3
Publishes temperature and status of button 

http://johnny-five.io/

https://aws.amazon.com/iot/how-it-works/

## Software prerequisites
* Raspbian
* Node 4 LTS 
```
# Using Debian, as root
curl -sL https://deb.nodesource.com/setup_4.x | bash -
apt-get install -y nodejs
```
* NPM 3

## Hardware used
* Raspberry Pi 3
* Raspberry Pi camera
* Cyntech GPIO breakout
* Camera Pan/tilt mount and 2 micro servos
* Breadboard
* Jumper wires
* 1x LED
* 1x Microswitch
* 1x DS18b20 One Wire temperature sensor
* 1x 10K resistor (for one wire bus)

## How to use
Enable the camera and One Wire in raspberry pi settings and reboot

Connect LED/ buttons/ One Wire temperature sensor to appropriate GPIO pins as per definitions in index.js (See http://www.modmypi.com/blog/ds18b20-one-wire-digital-temperature-sensor-and-the-raspberry-pi for details about connecting one wire temperature sensor and verifying it is working)

Create a "thing" in AWS IoT console, and download credential files to your device

Load kernel modules for one wire bus
```
sudo modprobe wire
sudo modprobe w1-gpio
sudo modprobe w1-therm
```

Export your AWS credentials for the image upload

```
export AWS_ACCESS_KEY_ID='AKID'
export AWS_SECRET_ACCESS_KEY='SECRET'
```

Edit AWS S3 bucket name/ AWS IoT details/path to credentials files in index.js

```
npm install
node index.js
```

From the AWA IoT console, you can then subscribe to the topics "button" and "temperature"

Publishing to the topic camera_shutter takes a photo (must send an empty JSON object as payload)

Publishing to the topic camera_aim with e.g body ```{"x" : 55, "y": 180}``` will set the positions of the pan/tilt servos to point the camera

Pressing the button will toggle the LED status and publish message indicating the button status

Files in common and device from AWS IoT SDK: 
https://github.com/aws/aws-iot-device-sdk-js
