var _ = require('lodash');
var minimist = require('minimist');
var chalk = require('chalk');
var webpack = require('webpack');

var HtmlWebpackPlugin = require('html-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var OpenBrowserWebpackPlugin = require('open-browser-webpack-plugin');

var DEFAULT_TARGET = 'BUILD';

var DEFAULT_PARAMS = {
    resolve: {
        extensions: ['', '.ts', '.tsx', '.js']
    },
    entry: {
        main: './src/main.tsx'
    },
    output: {
        publicPath: '',
        filename: '[name].[chunkhash].js',
        sourceMapFilename: '[name].[chunkhash].map'
    },
    externals: {
        'auth0-lock': 'Auth0Lock'
    },
    module: {
        loaders: [
            {test: /\.tsx?$/, loader: 'react-hot!ts-loader?jsx=true'},
            {test: /\.css$/, loader: 'style!css?localIdentName=[name]__[local]___[hash:base64:5]'},
            {test: /\.tpl.html/, loader: 'html'},
            {test: /\.(ico|png|jpg|gif|svg|eot|ttf|woff|woff2)(\?.+)?$/, loader: 'url-loader?limit=100000'}
        ],
        postLoaders: [
            { loader: "transform/cacheable?brfs" }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/index.html',
            inject: 'body'
        })
    ].concat(_bootswatchWorkaround()),
    devServer: {
        contentBase: 'dev/',
        port: 8081
    },
    debug: true,
    progress: true,
    colors: true
};

var PARAMS_PER_TARGET = {

    DEV: {
        devtool: 'inline-eval-cheap-source-map',
        output: {
            filename: '[name].js',
            sourceMapFilename: '[name].map'
        },
        plugins: [
            new OpenBrowserWebpackPlugin({ url: 'http://localhost:8081/' })
        ]
    },

    TEST: {
        devtool: 'inline-eval-cheap-source-map',
        output: {
            path: './test-build',
            filename: '[name].js',
            sourceMapFilename: '[name].map'
        },
        entry: {
            main: 'mocha!./test/test.ts'
        },
        plugins: [
            new CleanWebpackPlugin(['test-build']),
            new OpenBrowserWebpackPlugin({ url: 'http://localhost:8081/' }),
            new HtmlWebpackPlugin({
                template: './test/test.html',
                inject: 'body'
            })
        ]
    },

    BUILD: {
        output: {
            path: './build'
        },
        devtool: 'source-map',
        plugins: [
            new CleanWebpackPlugin(['build']),
            new webpack.optimize.DedupePlugin()
        ]
    },

    DIST: {
        debug: false,
        output: {
            path: './dist'
        },
        plugins: [
            new CleanWebpackPlugin(['dist']),
            new webpack.optimize.DedupePlugin(),
            new webpack.optimize.UglifyJsPlugin()
        ]
    }

};

var target = _resolveBuildTarget(DEFAULT_TARGET);
var params = _.merge(DEFAULT_PARAMS, PARAMS_PER_TARGET[target], _mergeArraysCustomizer);

_printBuildInfo(target, params);

module.exports = params;

function _resolveBuildTarget(defaultTarget) {
    var target = minimist(process.argv.slice(2)).TARGET;
    if (!target) {
        console.log('No build target provided, using default target instead\n\n');
        target = defaultTarget;
    }
    return target;
}

function _printBuildInfo(target, params) {
    console.log('\nStarting ' + chalk.bold.green('"' + target + '"') + ' build');
    if (target === 'DEV') {
        console.log('Dev server: ' + chalk.bold.yellow('http://localhost:' + params.devServer.port) + '\n\n');
    } else {
        console.log('\n\n');
    }
}

function _mergeArraysCustomizer(a, b) {
    if (_.isArray(a)) {
        return a.concat(b);
    }
}

function _bootswatchWorkaround() {
	var extensions = ['eot', 'woff', 'woff2', 'ttf', 'svg'];
	
	return extensions.map(function(ext) {
		var regexp = new RegExp('^\.\.\/fonts\/glyphicons-halflings-regular\.' + ext + '$');
		var dest = 'bootswatch/bower_components/bootstrap/dist/fonts/glyphicons-halflings-regular.' + ext;
		return new webpack.NormalModuleReplacementPlugin(regexp, dest);
	});
}
