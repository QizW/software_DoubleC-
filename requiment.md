

**开发环境:** Win10及以上发行版，Ubuntu 18.04+版本，MacOS最新版

**硬件环境**：无特殊要求，能正常连接网络的计算机即可

**前后端环境版本：**

```
Nodejs ~= v14.18.1

npm >= v6.14.17

React >= v17.0.2

Mongodb >= v6.0.2
```

**Nodejs 安装方式:** 登录Nodejs官网，进入安装链接:[<u><span class="15">Download | Node.js (nodejs.org)</span></u>](https://nodejs.org/en/download/),选择所需要的版本并安装到本地即可 安装结束后在命令行输入 node -v 输出 安装版本即安装成功

Npm会跟随nodejs安装

注:如果想要配置多版本Nodejs环境，则需要卸载掉本地的nodejs，然后通过链接：[<u><span class="15">Releases · coreybutler/nvm-windows (github.com)</span></u>](https://github.com/coreybutler/nvm-windows/releases)安装下载nvm

![](requiment/2022-12-16-23-21-09-image.png)

安装成功后可以通过 nvm install下载对应版本的Nodejs与配套的npm

#### **React安装方式：**在npm 安装成功后命令行输入npm install -g create-react-app即可下载react，在工程对应文件夹下执行npm install可直接安装配置react

**Mongodb安装方式：**

下载链接：

https://fastdl.mongodb.org/win32/mongodb-win32-x86_64-2008plus-ssl-3.2.21-signed.msi

通过链接安装后执行步骤，结束后在安装路径下创建data\db和data\log两个文件夹，在安装路径下创建mongod.cfg配置文件

 ![](requiment/2022-12-16-23-21-20-image.png)

运行安装后服务后可正常使用，具体安装细节可自行网络搜索

**相关安装包版本：**

后端：

```
    "@octokit/core": "^3.5.1",

    "bcryptjs": "^2.4.3",

    "cors": "^2.8.5",

    "dotenv": "^10.0.0",

    "express": "^4.17.1",

    "express-jwt": "^7.7.7",

    "helmet": "^4.6.0",

    "jsonwebtoken": "^8.5.1",

    "mongoose": "^6.1.2",

    "node-fetch": "^3.1.0",

    "xss-clean": "^0.1.1"
```

前端：

```
"@ant-design/charts": "^1.4.2",

    "@emotion/react": "^11.7.1",

    "@emotion/styled": "^11.6.0",

    "@mui/lab": "^5.0.0-alpha.60",

    "@mui/material": "^5.2.3",

    "@testing-library/jest-dom": "^5.11.4",

    "@testing-library/react": "^11.1.0",

    "@testing-library/user-event": "^12.1.10",

    "antd": "^5.0.7",

    "apexcharts": "^3.36.3",

    "axios": "^0.24.0",

    "date-fns": "^2.27.0",

    "faker": "^5.5.3",

    "jwt-decode": "^3.1.2",

    "lodash": "^4.17.21",

    "moment": "^2.29.1",

    "normalize.css": "^8.0.1",

    "numeral": "^2.0.6",

    "react": "^17.0.2",

    "react-apexcharts": "^1.4.0",

    "react-dom": "^17.0.2",

    "react-router-dom": "^6.1.1",

    "react-scripts": "4.0.3",

    "styled-components": "^5.3.3",

    "web-vitals": "^1.0.1"
```

注:在获取该工程后正常按照文档要求执行npm install 即可，但由于本软件的pytorch仓库是从本地导入的，因此需要安装Mongodb 插件,具体要求在install中
