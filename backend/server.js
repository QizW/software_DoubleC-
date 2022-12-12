const express = require("express");
const app = express();

//支持跨域访问用中间件，不需要知道他是干啥的对工程没有影响(他是支持跨端口访问的)
const cors = require("cors");
//没看懂，好像是防止cookie窃取攻击的，可是他也没设cookie啊？？？
const xss = require("xss-clean");
//依旧是安全保护，不用懂
const helmet = require("helmet");
//引入路由
const dashboar = require("./routes/dashboard");
//引入db
const connectDB = require("./db/connect");
//引入404中间件
const notFound = require("./middleware/notfound");
//引入自定义的错误处理中间件
const errorHandlerMiddleware = require("./middleware/error-handler");
//同样没看懂，他是引用env文件的环境变量的，但是她并没有设置env文件，大胆猜测把这个代码删除依旧可以正常运行
require("dotenv").config();

app.use(xss());
app.use(cors());
app.use(helmet());
app.use(express.json());

app.use("/", dashboar);

app.use(notFound);
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 4538;

const start = async () => {
  try {
    // await connectDB(process.env.MONGO_URI);
    await connectDB("mongodb://localhost:27017/DOUBLEC");
    //看起来他是运行在 http://127.0.0.1:4538 上的,跑起来会提示，但是我还没跑
    app.listen(port, console.log(`server is listening on port ${port}...`));
  } catch (error) {
    console.log(error);
  }
};

start();
