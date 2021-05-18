const path = require('path')
const wp = require('./webpack.config')

wp.devServer = {
  open: true,
  port: 9091,
}
module.exports = wp