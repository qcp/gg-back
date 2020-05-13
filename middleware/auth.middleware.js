const jwt = require("jsonwebtoken");
const ObjectId = require("mongodb").ObjectId;

module.exports.verifySignIn = (request, response, next) => {
    let token = request.headers['x-access-token'];

    if (!token) return response.json({ status: "ERROR", error: "No token provided!" });
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return response.json({ status: "ERROR", error: "Unauthorized!" });
        
        request.userId = ObjectId(decoded.id);
        request.userRole = decoded.role;
        next();
    });
};