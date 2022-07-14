const router = require("express").Router()
const users = require("../src/Models/user_model");
const admins = require("../src/Models/admin_model");
const courses = require("../src/Models/courses_model");
const UG_Form = require("../src/Models/UG_Form");
const Announcements = require("../src/Models/announcement")
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt");
const fs = require("fs")
const path = require('path');
const Jimp = require("jimp");













const UGformPicSaveAndSetup = async (imageSelct) => {

    // image setup compression
    const buffer = Buffer.from(imageSelct.replace(/^data:image\/(jpg|jpeg|png);base64,/, ''), 'base64')
    const imageName = `image_${Date.now()}-${Math.round(
        Math.random() * 1e9 //ye million hai
    )}.png`

    const jimpResp = await Jimp.read(buffer);
    jimpResp.resize(150, Jimp.AUTO).write(path.resolve(__dirname, `../Storage/UGForms/${imageName}`))

    return imageName;
}


router.post("/update/Profile", async (req, res) => {
    const { username, UserImage, Profile, Type } = req.body;
    const { LgnUser, LgnAdmin } = req.cookies;

    if (LgnUser) {
        const validateUser = await jwt.verify(LgnUser, process.env.HASH_SECERET);
        const findExistingImageOfUser = await users.findOne({ _id: validateUser._id });

        if (UserImage) {
            // saving image in Storage
            const buffer = Buffer.from(UserImage.replace(/^data:image\/(jpg|jpeg|png);base64,/, ''), 'base64')
            const imageName = `image_${Date.now()}-${Math.round(
                Math.random() * 1e9 //ye million hai
            )}.png`
            const jimpResp = await Jimp.read(buffer);
            jimpResp.resize(150, Jimp.AUTO).write(path.join(__dirname, `../Storage/Users/${imageName}`), (err, val, x) => {
            })


            // updation user profile with image in DB
            const findUser = await users.findOneAndUpdate({ _id: findExistingImageOfUser._id }, {
                username,
                Type: Type ? Type : findExistingImageOfUser.Type ? findExistingImageOfUser.Type : "",
                UserImage: `${process.env.BASE_URL}/Storage/Users/${imageName}`
            }, { new: true, upsert: true })


            // if first time upload then ignore this login if already upload then it will find and remove previous image and then upload new image
            if (Profile.length > 15) {
                const filepath = Profile.split(process.env.BASE_URL).slice(1, 2).join("")
                fs.unlinkSync(path.join(__dirname, `..${filepath}`))
            }
            return res.status(200).json({ findUser })
        }



        const findUser = await users.findOneAndUpdate({ _id: findExistingImageOfUser._id }, {
            username,
            Type: Type ? Type : findExistingImageOfUser.Type ? findExistingImageOfUser.Type : "",
            UserImage: findExistingImageOfUser.UserImage ? findExistingImageOfUser.UserImage : ""
        }, { new: true, upsert: true })
        return res.status(200).json({ findUser })



    } else if (LgnAdmin) {
        const validateUser = await jwt.verify(LgnAdmin, process.env.HASH_SECERET);
        const findExistingImageOfAdmin = await admins.findOne({ _id: validateUser._id });

        if (UserImage) {
            const buffer = Buffer.from(UserImage.replace(/^data:image\/(jpg|jpeg|png);base64,/, ''), 'base64')
            const imageName = `image_${Date.now()}-${Math.round(
                Math.random() * 1e9 //ye million hai
            )}.png`
            const jimpResp = await Jimp.read(buffer);
            jimpResp.resize(150, Jimp.AUTO).write(path.join(__dirname, `../Storage/Admins/${imageName}`), (err, val, x) => {
            })


            const findAdmin = await admins.findOneAndUpdate({ _id: findExistingImageOfAdmin._id }, {
                username,
                UserImage: `${process.env.BASE_URL}/Storage/Admins/${imageName}`
            }, { new: true, upsert: true })


            if (Profile.length > 15) {
                const filepath = Profile.split(process.env.BASE_URL).slice(1, 2).join("")
                fs.unlinkSync(path.join(__dirname, `..${filepath}`))
            }
            return res.status(200).json({ findAdmin })
        }



        const findAdmin = await admins.findOneAndUpdate({ _id: findExistingImageOfAdmin._id }, {
            username,
            UserImage: findExistingImageOfAdmin.UserImage ? findExistingImageOfAdmin.UserImage : ""
        }, { new: true, upsert: true })
        return res.status(200).json({ findAdmin })



    }

})





router.post("/register", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Invalid credentials" })
        }

        // finding existing user
        const findUser = await users.findOne({ username, email })
        if (findUser) {
            return res.status(400).json({ message: "This User already Registered!" })
        }

        // finding existing admin
        if (username === "admin" && email === "admin@gmail.com") {
            const findAdmin = await admins.findOne({ username, email });
            if (findAdmin) {
                return res.status(400).json({ message: "Cannot register with this username or email" })
            }

            // creating admin if not found
            const admin = await admins({
                username,
                email,
                password,
                status: false,
                isRole: "Admin",
                UserImage: ""
            }).save();

            return res.status(201).json({ findAdmin: admin })
        }

        // creating user if not found
        const bcrypPassword = await bcrypt.hash(password, 10);
        const user = await users({
            username,
            email,
            password: bcrypPassword,
            status: false,
            isRole: "User",
            UserImage: ""
        }).save();

        return res.status(201).json({ findUser: user });

    } catch (error) {
        return res.status(401).send(error)
    }
})




router.post("/login", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ message: "Invalid credentials" })
        }


        // finding existing admin and setting token and cookies
        const findAdmin = await admins.findOne({ email, password })
        if (findAdmin) {
            const registryToken = await jwt.sign({ _id: findAdmin._id }, `${process.env.HASH_SECERET}`);
            const { username, email } = findAdmin
            const updateAdminStatus = await admins.findOneAndUpdate(
                { username, email },
                {
                    status: true,
                    AccessToken: registryToken
                },
                { new: true, upsert: true }
            )
            res.cookie("LgnAdmin", `${registryToken}`, {
                httpOnly: true,
                // expires:new Date(Date.now()+120000)
            })
            return res.status(200).json({ findAdmin });
        } else {
            // finding existing user and setting token and cookies
            const findUser = await users.findOne({ email })
            if (findUser) {
                const hashPasswordCompareMatch = await bcrypt.compare(password, findUser.password)
                const registryToken = await jwt.sign({ _id: findUser._id }, `${process.env.HASH_SECERET}`);
                if (hashPasswordCompareMatch) {
                    const updateUserStatus = await users.findOneAndUpdate(
                        { username: findUser.username, email: findUser.email },
                        {
                            status: true,
                            AccessToken: registryToken,
                            Type: findUser.Type ? findUser.Type : ""
                        },
                        { new: true, upsert: true }
                    )

                    res.cookie("LgnUser", `${registryToken}`, {
                        httpOnly: true,
                        // expires:new Date(Date.now()+120000)
                    })
                    return res.status(200).json({ findUser })
                } else {
                    return res.status(400).json({ message: "Password Not Match.." })
                }
            } else {
                return res.status(400).json({ message: "User not Found" })
            }
        }




    } catch (error) {
        return res.status(400).send(error)
    }
})



router.get("/api/refresh", async (req, res) => {
    const { LgnUser, LgnAdmin } = req.cookies;


    try {
        // Working on User Auto refresh Login token
        if (LgnUser) {
            const refreshToken = await jwt.verify(LgnUser, `${process.env.HASH_SECERET}`);
            const newToken = await jwt.sign({ _id: refreshToken._id }, `${process.env.HASH_SECERET}`)
            try {
                const updateUserWithNewToken = await users.findByIdAndUpdate(
                    { _id: refreshToken._id },
                    {
                        AccessToken: newToken
                    },
                    { new: true, upsert: true }
                )

                res.cookie("LgnUser", `${newToken}`, {
                    httpOnly: true,
                    expires: new Date(Date.now() + 900000) //15 minutes for cookie expire
                })

                res.status(200).json({ findUser: updateUserWithNewToken })
            } catch (error) {
                return res.status(400).send(error)
            }

        } else if (LgnAdmin) {


            // Working on Admin Auto refresh Login token
            const refreshToken = await jwt.verify(LgnAdmin, `${process.env.HASH_SECERET}`);
            const newToken = await jwt.sign({ _id: refreshToken._id }, `${process.env.HASH_SECERET}`)
            try {
                const updateAdminwithNewToken = await admins.findByIdAndUpdate(
                    { _id: refreshToken._id },
                    {
                        AccessToken: newToken
                    },
                    { new: true, upsert: true }
                )

                res.cookie("LgnAdmin", `${newToken}`, {
                    httpOnly: true,
                    expires: new Date(Date.now() + 900000) //15 minutes for cookie expire
                })

                res.status(200).json({ findAdmin: updateAdminwithNewToken })
            } catch (error) {
                return res.status(400).send(error)
            }
        } else {
            res.status(200).json({ message: "Login first!" })
        }
    } catch (error) {
        console.error(error);
    }

})


router.get("/logout", async (req, res) => {
    const { LgnUser, LgnAdmin } = req.cookies;
    if (LgnAdmin) {
        const verifyToken = await jwt.verify(LgnAdmin, process.env.HASH_SECERET);
        const admin = await admins.findOne({ _id: verifyToken._id })
        if (admin) {
            const updateAdminStatus = await admins.findByIdAndUpdate(
                { _id: admin._id },
                {
                    status: false,
                    AccessToken: ""
                },
                { new: true, upsert: true }
            )
            res.clearCookie("LgnAdmin")
           return res.status(202).json({ message: "admin logout",updateAdminStatus })
        }
    } else if (LgnUser) {
        const verifyToken = await jwt.verify(LgnUser, process.env.HASH_SECERET);
        const user = await users.findOne({ _id: verifyToken._id })
        if (user) {
            const updateUserStatus = await users.findByIdAndUpdate(
                { _id: user._id },
                {
                    status: false,
                    AccessToken: ""
                },
                { new: true, upsert: true }
            )
            res.clearCookie("LgnUser")
           return  res.status(202).json({ message: "cleared cookie" })
        }
    }
})








// creating roles
router.post("/CreateRole", async (req, res) => {
    const { username, email, password, isRole } = req.body;
    try {
        // finding existing adminRole and otherwise creating new one
        const findAdmin = await admins.findOne({ username, email, password })
        if (findAdmin) {
            return res.status(202).json({ message: "already exist!" })
        }
        const createNewRole = await admins({
            username,
            email,
            password,
            isRole,
            status: false,
            UserImage: ""
        }).save();
        res.status(200).json({ message: "successfully created!" })
    } catch (error) {
        res.status(202).json({ message: "Error" })
    }
})


// getting all records of admins
router.get("/getAuthoritesInfo", async (req, res) => {
    const findAdmin = await admins.find({})
    const adminsCount = await admins.find({}).count();
    if (adminsCount === 0) {
        return res.status(202).json({ message: "No Record found!" })
    }
    return res.status(200).json({ record: findAdmin })
});


// deleting record of admin
router.get("/delete/adminRole/:id", async (req, res) => {
    let params = req.params.id;
    const deleteAdmin = await admins.findOneAndDelete({ _id: params });
    if (deleteAdmin) {
        return res.status(200).json({ message: "Deleted Successfully!" })
    } else {
        return res.status(202).json({ message: "Error: Not Found!" })
    }
})


// get updated role of authority
router.get("/admin/updateRole/:id", async (req, res) => {
    try {
        const params = req.params.id;
        // query to get only one  match emelent from an array very impotant
        const findAuthority = await admins.findOne({ _id: params });
        // console.log(findCourse);
        if (!findAuthority) {
            return res.status(202).json({ message: "user not found!" })
        }
        const specifiedData = {
            id: findAuthority._id,
            username: findAuthority.username,
            email: findAuthority.email,
            password: findAuthority.password,
            isRole: findAuthority.isRole
        }
        return res.status(200).json({ user: specifiedData })
    } catch (error) {
        return res.status(400).json({ message: error })
    }
})


// updated role of authority
router.post("/admin/updateRole/update", async (req, res) => {
    try {
        const { username, email, password, isRole, _id } = req.body;
        if (!username || !email || !password || !isRole) {
            return res.status(400).json({ message: "Missing Fields" })
        }
        // console.log(Course_no,Course_name,Course_status,Credit_hour,_id);

        const updateAuthorityRole = await admins.findOneAndUpdate({ _id }, {
            username,
            email,
            password,
            isRole
        },
            { new: true, upsert: true })
        return res.status(200).json({ updateAuthority: updateAuthorityRole })
    } catch (error) {
        return res.status(400).json({ message: error })
    }
})







// crete Degree
router.post("/CreateDegree", async (req, res) => {
    try {
        const { Degree } = req.body;
        const findRecord = await courses.findOne({ Degree: Degree });
        if (findRecord) {
            return res.status(202).json({ message: "Program already exist!" })
        }
        const programCretionone = await courses.create({
            Degree: Degree,
        })
        return res.status(200).json({ message: "successfuly created!" })
    } catch (error) {
        return res.status(400).json({ error })
    }
})

// courses api's create course
router.post("/createcourse", async (req, res) => {

    const { Degree, Course_no, Course_name, Credit_hour, Course_status } = req.body;
    if (!Degree || !Course_no || !Course_name || !Credit_hour || !Course_status) {
        return res.status(400).json({ message: "Missing Fields" })
    }


    try {
        // finding course with the same degree
        const findCourse = await courses.findOne({ $and: [{ Degree }, { "Courses.Course_no": Course_no }] }).populate("Courses")
        if (findCourse) {
            return res.status(401).json({ message: "Course already Exist in this degree." })
        }


        // updating course and adding new one in the same degree $push will add in last of array and dont match this element already present or not but addtoset will match if present it will not add
        const findDegreeAndInsertNewCourse = await courses.findOneAndUpdate({ Degree }, {
            $addToSet: {
                Courses: {
                    Course_no,
                    Course_name,
                    Credit_hour,
                    Course_status
                }
            },
        }
            , { new: true, upsert: true }
        );
        if (findDegreeAndInsertNewCourse) {
            return res.status(200).json({ message: "Successfully created!" })
        }



    } catch (error) {
        return res.status(400).json({ message: error })
    }
})


// getting all courses 
router.get("/allcourses", async (req, res) => {
    try {
        const findCourse = await courses.find({});
        const CountCourse = await courses.find({}).count();
        if (CountCourse === 0) {
            return res.status(202).json({ message: "No Program Created yet!" })
        }
        const setCourse = {
            id: findCourse._id
        }
        return res.status(200).json({ course: findCourse })
    } catch (error) {
        return res.status(400).json({ message: error })
    }
})



// getting single course 
router.post("/SingleProgram/Courses", async (req, res) => {
    const { id } = req.body
    try {
        const findCourse = await courses.findOne({ _id: id });
        if (findCourse) {
            return res.status(200).json({ course: findCourse })
        } else {
            return res.status(202).json({ message: "No Program Created yet!" })
        }
    } catch (error) {
        return res.status(400).json({ message: error })
    }
})


// deleting individual course
router.get("/delete/course/:id", async (req, res) => {
    try {
        let params = req.params.id;
        const deleteCourse = await courses.findOneAndUpdate({ "Courses._id": params }, {
            $pull: {
                Courses: {
                    _id: params
                }
            }
        }, { new: true, upsert: true })
        return res.status(200).json({ message: "succes" })
    } catch (error) {
        return res.status(400).json({ message: error })
    }
})


// getting individual course for update
router.get("/admin/course/:id", async (req, res) => {
    try {
        const params = req.params.id
        // query to get only one  match emelent from an array very impotant
        const findCourse = await courses.findOne({ "Courses._id": params }, { Courses: { $elemMatch: { _id: params } }, _id: 0 });
        // console.log(findCourse);
        if (!findCourse) {
            return res.status(400).json({ message: "no course found" })
        }
        // console.log(findCourse.Courses.map((course)=>{ console.log(params===course._id);}));
        return res.status(200).json({ course: findCourse })
    } catch (error) {
        return res.status(400).json({ message: error })
    }
})


// updating individual course
router.post("/admin/course/update", async (req, res) => {
    try {
        const { Course_no, Course_name, Course_status, Credit_hour, _id } = req.body;
        if (!Course_no || !Course_name || !Credit_hour || !Course_status) {
            return res.status(400).json({ message: "Missing Fields" })
        }
        // console.log(Course_no,Course_name,Course_status,Credit_hour,_id);

        const updateCourse = await courses.findOneAndUpdate({ "Courses._id": _id }, {
            // Courses:{$elemMatch:{Course_no,Course_name,Credit_hour,Course_status}}

            "Courses.$.Course_no": Course_no,
            "Courses.$.Course_name": Course_name,
            "Courses.$.Course_status": Course_status,
            "Courses.$.Credit_hour": Credit_hour,

        },
            { new: true, upsert: true })
        return res.status(200).json({ course: updateCourse })
    } catch (error) {
        return res.status(400).json({ message: error })
    }
})








// creating UG_Form Submission Process
// get specific course
router.post("/SpecificPrograms", async (req, res) => {
    const { Program } = req.body;
    if (!Program) {
        return res.status(202).json({ message: "Program Not Selected!" })
    }
    const specificProgram = await courses.findOne({ Degree: Program });
    if (specificProgram) {
        res.status(200).json({ SingleProgram: specificProgram });
    }
})


// get specific user
router.post("/GetSpecificUser", async (req, res) => {
    const { _id } = req.body;
    if (!_id) {
        return res.status(202).json({ message: "missing information" })
    }

    const fetchSpecificUser = await users.findOne({ _id });
    if (fetchSpecificUser) {
        return res.status(200).json({ user: fetchSpecificUser })
    }
    return res.status(202).json({ message: "user not found!" })
})



// creat UG_Form 
router.post("/UG_Form/Submit", async (req, res) => {
    const { Student_Name, Father_Name, Registry_No, Date_of_First_Submission, Semester, Status, FeePaid, Program, Courses, _id, imageSelct } = req.body;

    // validation
    if (!Student_Name || !Father_Name || !Registry_No || !Date_of_First_Submission || !Semester || !Status || !FeePaid || !Program || Courses.length < 1 || !_id || !imageSelct) {
        return window.alert("Fields are missing!")
    }

    const { LgnUser } = req.cookies;
    const validateUser = await jwt.verify(LgnUser, process.env.HASH_SECERET);
    // const findUser = await users.findOne({ _id: validateUser._id })
    const findUser = await users.findOne({ _id: validateUser._id }).populate('UGForm')
    const user = findUser.UGForm.find((val, index, arr) => {
        if (Registry_No === val.Registry_No && Student_Name === val.Student_Name && Status === val.Status) {
            return val
        }
    });


    // checking that if GS10 form already present or not with this data
    if (user) {
        return res.status(202).json({ message: "this form with this data already exists" })
    } else {
        // if UGFormSubmissionStatus is off then here it will add to user document otherwise it will not add
        if (findUser.UGFormSubmissionStatus === 'false') {
            // saving image in Storage
            const ImageRes = await UGformPicSaveAndSetup(imageSelct)

            const submitUgForm = await UG_Form({
                Student_Name, Father_Name, Registry_No, Date_of_First_Submission, Semester, Status, FeePaid, Program, Courses,
                FeeVoucher: `${process.env.BASE_URL}/Storage/UGForms/${ImageRes}`
            }).save();


            const updateUserUGForm = await users.findOneAndUpdate({ _id: findUser._id }, {
                $addToSet: {
                    UGForm: submitUgForm._id
                },
                UGFormSubmissionStatus: 'true'
            }, { new: true, upsert: true });
            res.status(200).json({ UG_Form: submitUgForm })
        }
    }
    // if (findUser) {
    //     // if UGFormSubmissionStatus is off then here it will add to user document otherwise it will not add
    //     if (findUser.UGFormSubmissionStatus === 'false') {
    //         // saving image in Storage
    //         const ImageRes = await UGformPicSaveAndSetup(imageSelct)

    //         const submitUgForm = await UG_Form({
    //             Student_Name, Father_Name, Registry_No, Date_of_First_Submission, Semester, Status, FeePaid, Program, Courses,
    //             FeeVoucher: `${process.env.BASE_URL}/Storage/UGForms/${ImageRes}`
    //         }).save();


    //         const updateUserUGForm = await users.findOneAndUpdate({ _id: findUser._id }, {
    //             $addToSet: {
    //                 UGForm: submitUgForm._id
    //             },
    //             UGFormSubmissionStatus: 'true'
    //         }, { new: true, upsert: true });
    //         res.status(200).json({ UG_Form: submitUgForm })
    //     }
    // }


})



// get populated single user with UG form
router.get("/user/UGForms", async (req, res) => {
    const { LgnUser } = req.cookies;
    const validateUser = await jwt.verify(LgnUser, process.env.HASH_SECERET);
    const findUser = await users.findOne({ _id: validateUser._id }).populate('UGForm');
    res.status(200).json({ UGForms: findUser })
})



// get all UGForms
router.get("/admin/AllUGForms", async (req, res) => {
    const { LgnAdmin } = req.cookies;
    const validateUser = await jwt.verify(LgnAdmin, process.env.HASH_SECERET);
    if (validateUser) {
        const UGForms = await UG_Form.find({});
        res.status(200).json({ UGForms: UGForms })
    }
})



// get UG Form for Authority to approve or reject
router.get("/admin/UGForm", async (req, res) => {
    const { isRole } = req.body;
    const usersUGForms = await UG_Form.find({ AuthoritiesApproval: { $ne: isRole } })
    // console.log(usersUGForms);
    res.status(200).json({ UGForms: usersUGForms })
})



// update UGForm with Authority signature
router.get("/admin/updateUGForm/:id/:role/:status", async (req, res) => {
    let Query = req.params.role;
    let params = req.params.id;
    let status = req.params.status;

    if (!Query || !params || !status) {
        return res.status(202).json({ message: "missing information" })
    }

    // creating a object format for saving responce of Authorities
    const uptodateAuthStatus = {
        Authority: Query,
        Status: status
    };

    const updateUGForm = await UG_Form.findOneAndUpdate({ _id: params }, {
        $addToSet: {
            AuthoritiesApproval: uptodateAuthStatus
        },
    }, { new: true, upsert: true })
    const checking = updateUGForm.AuthoritiesApproval.length
    if (checking >= 4 && !updateUGForm.AuthoritiesApproval.map((val, index, arr) => { return val.Status }).includes("Rejected")) {
        const updateFormStatus = await UG_Form.findOneAndUpdate({ _id: params }, {
            FormStatus: "Complete"
        }, { new: true, upsert: true })
    }
    if (Query && params && status && updateUGForm) {
        return res.status(200).json({ UGForm: updateUGForm })
    }
    return res.status(202).json({ message: "Rejected" })

})




// making update route for authorities so they can update the status approved or reject after they once approved or reject 
router.get("/admin/single/updateUGForm/:id",async(req,res)=>{
    let params = req.params.id;

    // console.log(params); 
    if ( !params ) {
        return res.status(202).json({ message: "missing information" })
    }

    // fetch that ugform and send to frontend
    const SingleUGForm=await UG_Form.findOne({_id:params})
    if (SingleUGForm) {
        // console.log(SingleUGForm);
        res.status(200).json({SingleUGForm});
    }else{
        res.status(202).json({message:"not found!"});
    }

})



// now approved or reject this single form
router.post("/admin/single/updateUGForm/:id/:role/:status",async(req,res)=>{
    let Query = req.params.role;
    let params = req.params.id;
    let status = req.params.status;

    if (!Query || !params || !status) {
        return res.status(202).json({ message: "missing information" })
    }

    const SingleUGForm=await UG_Form.findOneAndUpdate({_id:params,"AuthoritiesApproval.Authority":Query},{
        "AuthoritiesApproval.$.Authority":Query,
        "AuthoritiesApproval.$.Status":status,
    },
    { new: true, upsert: true })
    return res.status(200).json({ message:"Updated Successfully!" })

})





// get UG Form for Authority to approve or reject 
router.get("/user/UGForm/:id", async (req, res) => {
    const { id } = req.params;
    const usersUGForms = await UG_Form.findOne({ _id: id })
    // console.log(usersUGForms);
    res.status(200).json({ UGForm: usersUGForms })
})










// get all users
router.get("/totalusers", async (req, res) => {

    const totalusers = await users.find({})
    // console.log(usersUGForms);
    res.status(200).json({ Users: totalusers })
})





//create announcements
router.post("/Announcement/New", async (req, res) => {
    const { Title, Description, Authority, StartingDate, ClosingDate, Only_For, Semester } = req.body;
    // console.log(Title, Description, Authority, StartingDate, ClosingDate, Only_For, Semester);

    if (!Title || !Authority || !StartingDate || !ClosingDate) {
        return res.status(202).json({ message: "Incomplete Information" })
    }


    // for Regular-students or extra-enrollement stud.. here enabling UG_Form submission
    const UGFormEnableForRegularStudNewOne = await users.findOneAndUpdate({ Type: Only_For }, {
        UGFormSubmissionStatus: false
    }, { new: true, upsert: true })
    console.log(UGFormEnableForRegularStudNewOne);


    // creating new announcemnts
    const NewAnnounc_ = await Announcements({
        Title, Description, Authority, StartingDate, ClosingDate, Semester, Only_For
    }).save();
    // console.log(NewAnnounc_);

    if (NewAnnounc_) {
        res.status(200).json({ message: "Successfully Created New Announcement", Announcement: NewAnnounc_ })
    }

})


module.exports = router;