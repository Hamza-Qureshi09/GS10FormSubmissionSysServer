const dotenv = require('dotenv');
dotenv.config();
require("./Connection/conn")
const express = require("express");
const morgan = require("morgan");
const cookieParser = require("cookie-parser")
const cors = require('cors');
const ACTIONS = require("../actions")
const Routes = require('../Router/Routes')
const app = express();
const path=require("path")
const http = require("http")
const server = http.createServer(app)
const port = process.env.PORT; 

// working on socket.io 
const io = require("socket.io")(server);

// Some middlewares
app.use(express.json({ limit: '30mb' }));//is treeqy se hm server pr frontend se jo api ki request ari hai oska size brha skty hen
app.use(express.urlencoded({ extended: false }));
app.use(morgan("common"))
app.use(cookieParser({ limit: '30mb' }))
app.use(cors({
    credentials: true,
    origin: "http://localhost:3000"
}))
// for static images or avatar url
app.use('/Storage',express.static(path.join(__dirname,'../Storage')));

// creating routes
app.use(Routes)



server.listen(port, () => {
    console.log(`server is running on port ${port}`);
})