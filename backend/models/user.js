const mongoose = require('mongoose')
//详情见Repo，这里存的是用户规则，后续我要完善这个仓库规则
const User = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Please provide name'],
        maxlength: [20, 'Password should be less than 20 characters'],
        minlength: [3, 'Password should be more than 3 characters'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide email'],
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ ,
            'Please provide a valid email',
        ],
        unique: [true, 'The email is already used!'],
    },
    password: {
        type: String,
        required: [true, 'Please provide password'],
        minlength: [6, 'Password should be more than 6 characters'],
    }

})

module.exports = mongoose.model('user', User)