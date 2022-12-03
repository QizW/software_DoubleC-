//返回值是一个异步操作的函数，如果没有出错就直接await函数，出错了进入错误中间件
const asyncWrapper = (fn) => {
    return async (req, res, next) => {
        try {
            await fn(req, res, next)
        } catch (error) {
            next(error)
        }
    }
}

module.exports = asyncWrapper