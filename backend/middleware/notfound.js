//访问未知页面触发错误中间件
const notFound = (req, res) => res.status(404).send('Route does not exist')

module.exports = notFound