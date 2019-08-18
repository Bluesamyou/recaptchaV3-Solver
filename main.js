const electron = require('electron')
const { app, BrowserWindow, protocol, net, session } = electron;
const moment = require('moment');
const express = require('express')
const bodyParser = require('body-parser')
const fs = require('fs');

var expressApp, bankServer;

let signupBank = [];
let signupOpen = false;

// Really rough way of getting v3 captcha tokens easily during development
// Was using for size previews testing so you will need to change stuff around to work on other sites

// Load external style sheet
const cssFile = fs.readFileSync('./source/main.css', 'utf8');

// When app is ready
app.on('ready', () => {
	console.log("Ready for captchas...");
	signUpCreateWindow();
});

async function signUpCreateWindow() {

    captchaWindow = new BrowserWindow({
        width: 460,
        height: 680,
        frame: false,
        resizable: false,
        webPreferences: {
            allowRunningInsecureContent: true
        }
    });

	// Clears cookies, commented out atm
	// session.defaultSession.clearStorageData([]);
	// session.defaultSession.clearCache(() => {});

	captchaWindow.loadURL('https://accounts.google.com');
	captchaWindow.on('close', (e) => {
		signupOpen = false;
		captchaWindow = null;
	});

	captchaWindow.webContents.on('devtools-opened', () => { 
		captchaWindow.webContents.closeDevTools(); 
	});

	captchaWindow.webContents.session.webRequest.onBeforeRequest({urls: ['https://myaccount.google.com/*']}, (details, cb) => {
		captchaWindow.loadURL('https://size-mosaic-webapp.mesh.mx/');
		// Once the window is ready
		// captchaWindow.openDevTools();
		captchaWindow.webContents.once('dom-ready', () => {
			captchaWindow.webContents.executeJavaScript(
				`
					console.log("EXECUTING JAVASCRIPT");
					// Remove HTML body
					document.body.innerHTML = "";
					document.head.innerHTML = "";

					// // Create header element
					var header = document.createElement('header');
					document.body.appendChild(header);
					
					// Import JQuery so we can do stuff easier
					var jquery = document.createElement('script');
					jquery.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js";
					document.body.appendChild(jquery);
					
					// Import Sites ReCaptcha script
					var captcha = document.createElement('script');
					captcha.src = "https://www.google.com/recaptcha/api.js?render=6LcHpaoUAAAAANZV81xLosUR8pDqGnpTWUZw59hN";
					document.body.appendChild(captcha);

					// Import CSS
					var style = document.createElement('style');
					style.setAttribute('type', 'text/css');
					style.innerHTML = \`${cssFile}\`;

					// Append the CSS
					document.head.appendChild(style);

					// Main solve button
					// ///// ///// /////

					var solveButton = document.createElement('button');
					solveButton.setAttribute('id', 'downloadBtn');
					solveButton.setAttribute('onclick', 'loadCaptcha()');

					// Button text
					var spanText = document.createElement('span');
					spanText.setAttribute('id', 'buttonText');
					spanText.innerHTML = "SOLVE";
					solveButton.appendChild(spanText);

					// Button check mark
					var checkMark = document.createElement('svg');
					checkMark.setAttribute('id', 'checkMark');
					checkMark.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
					checkMark.setAttribute('viewBox', '0 0 18.999 18.521');
					spanText.append(checkMark);

					// Defs attribute
					var defs = document.createElement('defs');
					checkMark.appendChild(defs);

					// Checkmark styling
					var checkStyle = document.createElement('style');
					checkStyle.innerHTML = \`.a{fill:none;stroke:#fff;stroke-linecap:round;stroke-linejoin:round;stroke-width:4px;}\`;
					defs.appendChild(checkStyle);

					// Path styling
					var path = document.createElement('path');
					path.setAttribute('class', 'a');
					path.setAttribute('d', 'M5491.726,6110.206l6.457,6.619,8.543-14.521');
					path.setAttribute('transform', 'translate(-5489.726 -6100.303)');
					console.log(path);
					checkMark.appendChild(path);			

					// Add to document
					document.body.appendChild(solveButton);

					// Break
					var br = document.createElement('br');
					var brToo = document.createElement('br');
					document.body.appendChild(br);
					document.body.appendChild(brToo);

					// captcha count
					var capcount = document.createElement('p');
					capcount.setAttribute('class', 'capCount');
					capcount.setAttribute('id', 'capCount');
					capcount.innerHTML = "{ captchaCount : 0 }";
					document.body.appendChild(capcount);

					// Signout google
					var signout = document.createElement('button');
					signout.setAttribute('class', 'signout');
					signout.setAttribute('onclick', 'signout()');
					signout.innerHTML = "signout google";
					document.body.appendChild(signout);

					// Google gif thing
					var googlegif = document.createElement('img');
					googlegif.setAttribute('class', 'google-gif');
					googlegif.setAttribute('src', 'https://i.pinimg.com/originals/58/4b/60/584b607f5c2ff075429dc0e7b8d142ef.gif');
					document.body.appendChild(googlegif);

					// Button animation script
					var buttonScript = document.createElement('script');
					buttonScript.setAttribute('type', 'text/javascript');
					buttonScript.innerHTML = \`
						var downloadBtn = document.querySelector("#downloadBtn");
						var buttonText = document.querySelector("#buttonText");
						var checkMark = document.querySelector("#checkMark");
						var background = document.querySelector("#background");
						downloadBtn.addEventListener("click", async function () {
							downloadBtn.classList.add("checked");
							buttonText.classList.add("fadeOut");
							await delay(200);
							buttonText.classList.add("gone");
							checkMark.classList.add("checked");
							await delay(500);
							goBackNormal();
						});
						const goBackNormal = async () => {
							$("#downloadBtn").removeAttr('class');
							await delay(300);
							$("#buttonText").removeAttr('class');
							$("#checkMark").removeAttr('class');
						};
						function delay(ms) {
							return new Promise(resolve => setTimeout(resolve, ms));
						};
					\`;
					
					// Add to document
					document.body.appendChild(buttonScript);

					// Captcha script
					var captchaScript = document.createElement('script');
					captchaScript.setAttribute('type', 'text/javascript');
					captchaScript.innerHTML = \`
						let a = 0;
						const loadCaptcha = () => {
							grecaptcha.ready(() => {
								grecaptcha.execute('6LcHpaoUAAAAANZV81xLosUR8pDqGnpTWUZw59hN', {action: 'Login/SignUp'}).then((token) => {
									console.log("CAPTCHA TOKEN : ", token);
									sub(token); // send to backend
									count(); // display captcha count
									return;
								});
							});
						};		
						const count = () => {
							a++;
							document.getElementById('capCount').innerHTML = '{ captchaCount : ' + String(a) + ' }';
						}	
						
						// const remote = require('electron').remote;
						// const app = remote.app;
						const ipcRenderer = require('electron').ipcRenderer;
						const sub = (token) => {
							ipcRenderer.send('sendSignUpCaptcha', token);
						};
						// const signout = (message='signout') => {
						// 	ipcRenderer.send(message);
						// };

					\`;

					// Add to document
					document.body.appendChild(captchaScript);

					// Jquery
					jquey = document.createElement('script');
					jquey.src = "https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js";
					document.body.appendChild(jquey);

				`
			);
		});
	});
}

electron.ipcMain.on('sendSignUpCaptcha', (event, token) => {
	console.log("RECEIVED IN MAIN PROCESS:\n", token);
	signupBank.push({
		token: token,	
		timestamp: moment()
	});
});


// Check captcha bank every second to check that no tokens are expired...
// if there are expired tokens present, remove them
setInterval(() => {
	for (var i=0; i<signupBank.length; i++) {
		if (moment().diff(moment(signupBank[i].timestamp), 'seconds') > 100) {
			console.log("Captcha token expired, removing it from storage...");
			signupBank.splice(0,1);
		}
	}
}, 1000);


const captchaBankServer = () => {
	expressApp = express();
	expressApp.set('port', '8080');
	expressApp.use(bodyParser.json());
	expressApp.use(bodyParser.urlencoded({extended: true}));
	// Open the signup captcha window
	expressApp.get('/signup-start', (req, res) => {
		if (signupOpen === true) return;
		signupOpen = true;
		signUpCreateWindow();
	});
	// Retrieve signup captcha tokens
	expressApp.get('/signup-get', (req, res) => {
		return res.json(signupBank),
		signupBank.splice(0,1);
	});
	// Start server
	bankServer = expressApp.listen(expressApp.get('port'));
}

captchaBankServer();