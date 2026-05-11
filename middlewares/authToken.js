const jwt = require("jsonwebtoken");

// Middleware to validate token
// exports.authenticateToken = (req, res, next) => {
//   const token = req.header("Authorization");
//   if (!token)
//     return res
//       .status(401)
//       .json({ message: "Access denied. No token provided." });

//   //   jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
//   //     if (err) return res.status(403).json({ message: "Invalid token." });
//   //     req.user = user;
//   //     next();
//   //   });

// };

exports.authenticateToken = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token)
      return res
        .status(401)
        .json({ message: "Access denied. No token provided." });
  
    // Replace 'yourStoredToken' with the actual token stored securely
    const storedToken = "Bearer eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJzdWIiOiAiMTIzNDU2Nzg5MCIsICJuYW1lIjogIkpvaG4gRG9lIiwgImV4cCI6IDE2MzM4NzIwMDAsICJhbGciOiAiSFMyNTYifQ.BXGE32tUv9wEcFp6cSqVqZLa9tbxDx2RM5IyWvPcYk4";
  
    if (token === storedToken) {
      next();
    } else {
      return res.status(401).json({ message: "Access denied. Invalid token." });
    }
  };
  