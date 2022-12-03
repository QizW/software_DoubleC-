const mongoose = require('mongoose')
//连数据库的，他这个文件写的很丑陋，为什么要返回一个连接函数而不是在这个文件里连接然后返回连接成功之后的对象呢??
const connectDB = (url) => {
    return mongoose.connect(url)
}

module.exports = connectDB