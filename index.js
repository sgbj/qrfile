var fs = require('fs');
var path = require('path');
var http = require('http');
var os = require('os');
var qrcode = require('qrcode-terminal');
var mime = require('mime');
var inquirer = require('inquirer');

var ipv4s = [];
var interfaces = os.networkInterfaces();
for (var iface in interfaces) {
    interfaces[iface].forEach(function (addr) {
        if (addr.family == 'IPv4') {
            ipv4s.push(addr.address);
        }
    });
}

var questions = [{
    type: 'list',
    name: 'iface',
    message: 'Which network interface do you want to bind to?',
    choices: ipv4s
}];

if (process.argv.length < 3) {
    questions.unshift({
        type: 'input',
        name: 'fpath',
        message: "What file do you want to transfer?"
    });
}

inquirer.prompt(questions).then(function (answers) {
    var location = answers.fpath || process.argv[2];
    var ip = answers.iface;

    if (!fs.existsSync(location)) {
        console.log('File not found: ' + location);
        return;
    }
    
    var stat = fs.statSync(location);
    var mimeType = mime.getType(location);
    
    var server = http.createServer(function(req, res) {
        var stream = fs.createReadStream(location);
        stream.pipe(res);
    });
    
    server.listen(0, ip);
    
    server.on('listening', function() {
        var port = server.address().port;
        console.log('http://' + ip + ':' + port);
        qrcode.generate('http://' + ip + ':' + port, { small: true });
    });
});
