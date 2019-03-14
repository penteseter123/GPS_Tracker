'use strict';
var express = require('express'); // mengambil Variable atau Import program
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const session = require('express-session');
var app = express(); // mengambil Variable atau Import program
var http = require('http').Server(app); // mengambil Variable atau Import program akan di jadikan server
var io = require('socket.io')(http); // mengambil Variable atau Import program
var fs = require('fs'); // mengambil Variable atau Import program
var bodyParser = require('body-parser');
var ejs = require('ejs');
// var compiled = ejs.compile(fs.readFileSync(__dirname + '/views/dashboards.ejs', 'utf8'));
// var html = compiled();
var engine = require('ejs-mate');
var Gpio = require('onoff').Gpio; // mengambil Variable atau Import program , mengaktifkan GPIO pada Raspbarry Pi
// var Gpio = require('pigpio').Gpio;
var Relay = new Gpio(17, 'out'); // mengambil Variable atau Import program, Pin yang akan di aktifkan 
var Relay1 = new Gpio(18, 'out');
Relay.writeSync(1);
Relay1.writeSync(1);
var file = '/dev/ttyACM0'; // mengambil Variable atau Import program, mengambil serial / usb mana yang terhubung pada gps 
var pushButton = new Gpio(19, 'in', 'both'); // mengambil Variable atau Import program 
var pushButton = new Gpio(20, 'in', 'both');
// const publicVapidKey = 'BBUz4z9OWtuSffSWjABlRK-9XPEJY7bPiyKHMP3UumZGFZjnBMgVd80eczdjx46nvC9UOm9uevrO5LKW99FUxnA'
// const privateVapidKey= '7GWWHvglnrwibc4zc5cxrHz2sjPunlbndx80rert7OE'

// webpush.setVapidDetails('mailto:muhammadrobby45@gmail.com', publicVapidKey, privateVapidKey);

// var firebase = require('firebase');
// var config = {
//   apiKey: "AIzaSyDSbJELh7YjH18joR21tNRDtVF22nmQy_o",
//   authDomain: "maps-cb195.firebaseapp.com",
//   databaseURL: "https://maps-cb195.firebaseio.com",
//   projectId: "maps-cb195",
//   storageBucket: "maps-cb195.appspot.com",
//   messagingSenderId: "160338368818"
// };
// firebase.initializeApp(config);

// var auth = firebase.auth();

// var provider = new firebase.auth.GoogleAuthProvider();
// auth.signInWithPopup(provider).then(function (result) {
//   var accessToken = result.credential.accessToken;
// });
// auth.onAuthStateChanged(function (user) {
//   if (user) {
//     // User signed in!
//     var uid = user.uid;
//   } else {
//     // User logged out
//   }
// });


// let html = ejs.render('<input type="text" disabled="<%=disabled%>" value="<%=value%>" />', {
//     disabled: false,
//     value: 'hi you'
// }, {
//     vars: ['disabled', 'value']
// })

// Passport Config
require('./config/passport')(passport);

// DB Config
const db = require('./config/keys').mongoURI;

mongoose
  .connect(
    db, {
      useNewUrlParser: true
    }
  )
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log(err));



// heroku config:set PM2_PUBLIC_KEY=q9x3aor6tn0e657 PM2_SECRET_KEY=zo04mi7o6rtw2xu

// const aws = require('aws-sdk');

// let PM2 = new aws.PM2({
//   accessKeyId: PM2_PUBLIC_KEY=q9x3aor6tn0e657
//   secretAccessKey: process.env.PM2_SECRET_KEY=zo04mi7o6rtw2xu
// });

// var localtunnel = require('localtunnel');

// var tunnel = localtunnel(5000, function (err, tunnel) {
//   https: //robby.localtunnel.me
//     tunnel.url;
//   console.log("Server Konek ke", tunnel.url);
// });

// tunnel.on('close', function () {
//   //     tunnels are closed
// });

const SerialPort = require('serialport');
const parsers = SerialPort.parsers;

const parser = new parsers.Readline({
  delimiter: '\r\n'
});

const port = new SerialPort(file, {
  baudRate: 9600
});
port.pipe(parser);


var GPS = require('./gps.js'); // Ambil Data dari Json
var gps = new GPS;
// gps.state.bearing = 0;
var prev = {
  lat: null,
  lon: null
};

gps.on('GGA', function (data) { //mengambilkan data dari GPS
  io.emit('position', data);
  console.log("Latitiude :", data.lat);
  console.log("Longitude :", data.lon);
});

gps.on('data', function () {
  if (prev.lat !== null && prev.lon !== null) {
    gps.state.bearing = GPS.Heading(prev.lat, prev.lon, gps.state.lat, gps.state.lon);
  }
  io.emit('state', gps.state);
  prev.lat = gps.state.lat;
  prev.lon = gps.state.lon;;
});

app.use(expressLayouts);
app.use(express.static("views"));
app.engine('ejs', engine);
app.set('view engine', 'ejs');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Express body parser
app.use(express.urlencoded({
  extended: true
}));

// Express session
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
  })
);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// var filePath = __dirname + '/views/dashboard.ejs';
// var template = fs.readFileSync(filePath, 'utf8');
// res.end(ejs.render(template, {}));
// });

// Connect flash
app.use(flash());

// Global variables
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  next();
});

// Routes
app.use('/', require('./routes/index.js'));
app.use('/users', require('./routes/users.js'));

app.get('/dashboard', function (req, res, next) { // Menambil data dari GPS dan mengirimkan nya kembali ke html 
  res.render(__dirname + '/views/dashboard.ejs');
});


parser.on('data', function (data) { // Memparserkan data yang di hasilkan dari GPS dan di ubah menjadi Data2 Latitude longitude 
  gps.update(data);
});

// port.on('data', function (data) {
//   gps.updatePartial(data);
// });

process.on('unhandledRejection', function (reason, p) {
  //I just caught an unhandled promise rejection, since we already have fallback handler for unhandled errors (see below), let throw and let him handle that
  console.log("=============");
  console.log(reason);
  console.log("=============");
  return;
});

process.on('rejectionHandled', () => {});

process.on('uncaughtException', function (error) {
  console.log(error);
});

port.on('close', function (data) {

  console.log("Port closed");
  console.log(port.binding);

});

function handler(req, res) { // Membuat Server Request 
  fs.readFile(__dirname + '/views/maps.ejs', function (err, data) { // Membaca Format bertype HTML pada web browser 
    if (err) {
      res.writeHead(404, {
        'Content-Type': 'text/xml'
      }); // Menampilkan Eror Di web 
      return res.end("Eror Tidak Di Temukan ");
    }
    res.writeHead(200, {
      'Content-Type': 'text/xml'
    }); // mengirimkan data dan meunilakannya pada html ini adalah data yang kan di hasilkan dari GPS Latitude dan Longitude
    res.write(data); //menuliskan data dan di kirim kepada html
    return res.end();
  });
}

io.sockets.on('connection', function (socket) { //Mengaktifkan Function Socket pada web 
  var lightvalue = 0; //Status pada kendaraan ON atau OFF Function 0 atau 1 
  pushButton.watch(function (err, value) { // Melihat Kondisi Pada Tombbol
    if (err) { // Jika Eror Kondisi Jika Terjadi eror Maka Akan Keluar 
      console.error('Program Eror Tidak Berjalan Segera Perbaiki Program nya dan ulangi kembali ', err); //output yang di hasilkan jika terjadi eror 
      return;
    }
    lightvalue = value;
    socket.emit('light', lightvalue); //Mengirimkan tombol status pada client
  });
  socket.on('light', function (data) { // Mengetahui function pada switch untuk keadaan status nya pada client 
    lightvalue = data;
    console.log("Keadaan Motor :", lightvalue);
    if (lightvalue != Relay.readSync()) { // Mengetahui Status pada Relay 
      Relay.writeSync(lightvalue); // Turn ON OFF Relay
    }
  });
});

io.sockets.on('connection', function (socket) { //Mengaktifkan Function Socket pada web 
  var light1value = 0; //Status pada kendaraan ON atau OFF Function 0 atau 1 
  pushButton.watch(function (err, value) { // Melihat Kondisi Pada Tombbol
    if (err) { // Jika Eror Kondisi Jika Terjadi eror Maka Akan Keluar 
      console.error('Program Eror Tidak Berjalan Segera Perbaiki Program nya dan ulangi kembali ', err); //output yang di hasilkan jika terjadi eror 
      return;
    }
    light1value = value;
    socket.emit('light1', light1value); //Mengirimkan tombol status pada client
  });
  socket.on('light1', function (data) { // Mengetahui function pada switch untuk keadaan status nya pada client 
    light1value = data;
    console.log("Keadaan Motor :", light1value);
    if (light1value != Relay1.readSync()) { // Mengetahui Status pada Relay 
      Relay1.writeSync(light1value); // Turn ON OFF Relay
    }
  });
});

process.on('SIGINT', function () { // Program untuk Mematikan Secara Paksa Ctrl+C
  Relay.writeSync(0); // Mematikan Relay Secara otomatis
  Relay.unexport(); // Mengunexport GPIO pada Raspbarry pi
  Relay1.writeSync(0); // Mematikan Relay Secara otomatis
  Relay1.unexport(); // 
  pushButton.unexport(); // Tombol Button Untuk Kontrol ON OFF
  process.exit(); // Proses Selesei Exit
});

http.listen(5000, function () {
  //  console.log('App Listening on port %s', http.address().port);
  console.log('listeting on *:5000');
});