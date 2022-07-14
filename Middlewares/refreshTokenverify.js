const jwt = require("jsonwebtoken");
const RefreshModel = require("../src/Models/refreshmodel");

const authMiddleware = async (req, res, next) => {
    try {
        // get refresh token from cookie
        const { RefreshToken: refreshTokenFormAACookie } = req.cookies;
        if (!refreshTokenFormAACookie) {
            return res.status(401).json({ Message: "Token not Found!" })
        }
        // console.log(refreshTokenFormAACookie);
        // check if token is valid or not
        const validRefreshToken = await jwt.verify(refreshTokenFormAACookie, process.env.RefreshToken_Secret)
        if (!validRefreshToken) {
            return res.status(401).json({ Message: "Token is not Valid" })
        }
        // console.log(validRefreshToken);
        // check if token is in db or not and also check userId valid or not?
        const validUser = await RefreshModel.findOne(
            {
                userId: validRefreshToken._id,
                RefreshToken: refreshTokenFormAACookie
            }
        )
        if (!validUser) {
            return res.status(401).json({ Message: "No user!" })
        }
        // console.log(validUser);
        // generating new Tokens
        const NewAccessToken = await jwt.sign({ _id: validRefreshToken._id }, process.env.AccessToken_Secret, {
            expiresIn: '1h',
        })
        const NewRefreshToken = await jwt.sign({ _id: validRefreshToken._id }, process.env.RefreshToken_Secret, {
            expiresIn: '1y',
        })
        console.log(validRefreshToken._id+"valid token id");
        // setting variables
        req.userId = validRefreshToken._id
        req.NewAccessToken = NewAccessToken
        req.NewRefreshToken = NewRefreshToken
        next()
        // res.status(200).json({message:"okay"})
    } catch (error) {
        res.status(401).json({ Message: "Error in RefreshMiddleware", Error: error })
    }
}
module.exports = authMiddleware;