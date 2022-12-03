class CustomAPIError extends Error {
    constructor(message, statusCode) {
        super(message)//继承父类Error的message
        this.statusCode = statusCode
    }
}

const createCustomError = (msg, statusCode) => {
    return new CustomAPIError(msg, statusCode)
}

module.exports = { createCustomError, CustomAPIError }