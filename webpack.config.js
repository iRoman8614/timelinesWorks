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
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        chunkFilename: '[name].chunk.js',
    },

    resolve: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
};