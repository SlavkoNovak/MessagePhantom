/*
The MIT License (MIT)

Copyright (c) 2014 Slavko Novak [slavko.novak.esen@gmail.com]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
*/

var http = require("http");
var url = require("url");

//Global variables -->

var SERVICE_IP_ADDRESS = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var SERVICE_PORT = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var MAX_DATA_ENTRY = 1000;
var MESAGE_TIMEOUT_MIN = 60;
var DATA = {};

//<-- Global variables

function index(res) {
  var html  = "<!DOCTYPE html>\n"
            + "<html>\n"
            + " <head>\n"
            + "   <title>MPhantom json/jsonp service</title>\n"
            + " </head>\n"
            + " <body>\n"
            + "   <h3>\n"
			+ "   MPhantom json/jsonp service"
            + "   </h3>\n"
            + " </body>\n"
            + "</html>";
    res.writeHead(200, {"Content-Type": "text/html"});
    res.end(html);
}

function DoTimeout() {
	var delKeys = [];
	
	for(var key in DATA) {
		if((new Date() - DATA[key].DateTime) / 60000 > MESAGE_TIMEOUT_MIN) {
			delKeys.push(key); 
			console.log("Message with code: " + key + " timeoute.")
		}
	}
	
	for(var key in delKeys) {
		var delCode = delKeys[key];
		delete DATA[delCode];
		console.log("Message with code: " + delCode + " deleted.")
	}
}

function SetMessage(code, message, callback, res) {
	var resStr = "";
	var itemsCount = Object.keys(DATA).length;
	
	console.log("Before add; DATA items count is " + itemsCount);
	console.log("Message code: " + code + " is to be written.");
	
	if(itemsCount < MAX_DATA_ENTRY) {
		DATA[code] = {MsgText: message, DateTime: new Date()};
		resStr = JSON.stringify({Code:code, MsgText: message});
	}
	else {
		resStr = JSON.stringify({Code:code, MsgText: "ERR: Service full!"});
	}
	
	console.log("After add; DATA items count is " + Object.keys(DATA).length);
	if(Object.keys(DATA).length > itemsCount) {
		console.log("Message code: " + code + " is written.");
	}
	
	if(callback == null) {
		res.writeHead(200, {"Content-Type": "application/json", "charset": "utf-8"});
		res.end(resStr);
	}
	else {
		res.writeHead(200, {"Content-Type": "text/javascript", "charset": "utf-8"});
		res.end(callback + "(" + resStr + ");");	
	}
}

function GetMessage(code, callback, res) {
	var resStr = "";
	var itemsCount = Object.keys(DATA).length;
	
	console.log("Before read; DATA items count is " + itemsCount);	
	console.log("Message code: " + code + " is to be read.");
	
	var msg = DATA[code] == null ? "No message for code: " + code : DATA[code].MsgText;
	resStr = JSON.stringify({Code:code, MsgText: msg});
	delete DATA[code];
	
	console.log("After read; DATA items count is " + Object.keys(DATA).length);
	if(Object.keys(DATA).length < itemsCount) {
		console.log("Message code: " + code + " is read.");
	}
	
	if(callback == null) {
		res.writeHead(200, {"Content-Type": "application/json", "charset": "utf-8"});
		res.end(resStr);
	}
	else {
		res.writeHead(200, {"Content-Type": "text/javascript", "charset": "utf-8"});
		res.end(callback + "(" + resStr + ");");
	}
}

http.createServer(function (req, res) {
  DoTimeout();

  urlObj = url.parse(req.url, true);
  
  if(urlObj.pathname === "/SetMessage") {
	SetMessage(urlObj.query["Code"], urlObj.query["MsgText"], urlObj.query["callback"], res);
  }
  else if(urlObj.pathname === "/GetMessage") {
	GetMessage(urlObj.query["Code"], urlObj.query["callback"], res);
  }
  else
  {
    index(res);
  }
}).listen(SERVICE_PORT, SERVICE_IP_ADDRESS);