const wp = require('./webpack.config')
wp.mode = 'production'
wp.output.filename = 'snake-[hash:8].js'

module.exports = wp