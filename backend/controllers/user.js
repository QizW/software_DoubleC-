const user = require("../models/user");
const asyncWrapper = require("../middleware/async");
const { createCustomError } = require("../errors/custom-error");
const bcryotjs = require('bcryptjs')
const Token = require('jsonwebtoken')
const configue = require('../config')

//用户登录函数
//非常需要注意的问题，他的文件中并没有表明前后端传输交互过程中数据的格式，因此我们需要去console.log(req.body)意义查看验证，我需要在此基础上对代码进行修改，前端需要同步，不然原来的程序也跑不起来
const CheckUser = asyncWrapper(async (req, res, next) => {
  //查看用户是否存在，恶心死了，他用的是mongodb的固有接口，我们需要去自己看怎么用
  const OldUser = await user.findOne({ email: req.body.email });
  console.log(req.body);
  //原有用户不存在
  if (!OldUser) {
    return next(createCustomError(`Email is not registered`, 404));
  } else if (bcryotjs.compareSync(req.body.password, OldUser.password)) {
    //根本没做加密！数据库里存真实密码
    const tokenstr = Token.sign({email:req.body.email}, configue.jwtSecretKey, {expiresIn: configue.expiresIn})
    return res.status(200).json({
      //他用的是标准status代表含义 即http自身规则，我们用起来还是很麻烦
      name: OldUser.username,
      token : 'Bearer '+tokenstr
    });
  } else {
    //错误中间件
    return next(createCustomError(`Wrong password`, 404));
  }
});

//创建用户
const CreateUser = asyncWrapper(async (req, res, next) => {
  try {
    //判断用户名和用户注册邮箱是否已经存在
    console.log(req.body)
    const user_name = await user.findOne({ username: req.body.username });
    const user_email = await user.findOne({ email: req.body.email });
    if (!user_name && !user_email) {
      req.body.password = bcryotjs.hashSync(req.body.password, 10)
      const new_user = await user.create(req.body);
      res.status(201).json({
        name: new_user.username,
      });
    } else return next(createCustomError(`User already exists`, 404));
  } catch (err) {
    //这个错误为啥是404我没看懂
    console.log(err);
    res.status(404).json(err);
  }
});

module.exports = {
  CheckUser,
  CreateUser,
};
