#!/bin/bash
sudo killall gpsd
sudo gpsd /dev/ttyACM0 -F /var/run/sock.gpsd
sudo killall node
