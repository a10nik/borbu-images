var minimist = require('minimist');
var connect = require('connect');
var serveStatic = require('serve-static');

var port = process.env.OPENSHIFT_NODEJS_PORT || 8090;
var ip = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";

var TARGET_PATH_MAPPING = {
    BUILD: './build',
    DIST: './dist'
};

var TARGET = minimist(process.argv.slice(2)).TARGET || 'BUILD';

connect()
    .use(serveStatic(TARGET_PATH_MAPPING[TARGET]))
    .listen(port, ip);

console.log('Created server for: ' + TARGET + ', listening on ' + ip + ':' + port);