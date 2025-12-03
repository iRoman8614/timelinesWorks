const path = require('path');

module.exports = {
    mode: 'development',
    devtool: 'source-map',

    optimization: {
        minimize: false,
        usedExports: false,
        sideEffects: false,
        concatenateModules: false,
    },

    output: {
        publicPath: '/optimizer/',
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js',
        chunkFilename: '[name].chunk.js',
    },

    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
};