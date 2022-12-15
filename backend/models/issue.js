const mongoose = require('mongoose')
//连接Mongodb的库，具体见 https://blog.csdn.net/yw00yw/article/details/81775398


//定义Repo的仓库的规则，下面都是存仓库必须提供的
const Issues = new mongoose.Schema({
    title: {
        type: String,
    },
    body: {
        type: String,
    },
    created_at:{
        type:String,
    }
})

module.exports = mongoose.model('IssueSchema', Issues)