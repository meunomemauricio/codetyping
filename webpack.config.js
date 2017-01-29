module.exports = {
    entry: './src/codetype.js',
    output: {
        path: './dist',
        filename: 'codetype.js',
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel',
                exclude: /node_modules/
            },
        ]
    },
    resolve: {
        alias: {
            // Use the standalone build for Vue, since components are using
            // the 'template' option.
            // https://vuejs.org/v2/guide/installation.html#Standalone-vs-Runtime-only-Build
            'vue$': 'vue/dist/vue.common.js'
        }
    }
}
