const router = require("express").Router();
const { User, validateUser } = require("../models/User");
const bcrypt = require("bcrypt");
const Joi = require("joi");
const Opt = require('../models/Otp')
const Token = require('../models/Token')
const sendEmail = require('../utils/sendEmail')
const crypto = require('crypto');
const Otp = require("../models/Otp");

//To get All Users
router.get('/getAllUsers',async(req,res)=>{
	try {
		const response = await User.find({})
		return res.status(200).send(response)
	} catch (error) {
		return res.status(500).send(error)
	}
})

//To get Single Users
router.get('/getSingleUsers/:userId',async(req,res)=>{
	try {
		const response = await User.findOne({_id:req.params.userId})
		let obj = {
			firstName : response.firstName,
			lastName : response.lastName,
			email : response.email,
			isAdmin : response.isAdmin,
			EmailVerified : response.verified

		}
		return res.status(200).send(obj)
	} catch (error) {
		return res.status(500).send(error)
	}
})
//To get is User Admin
router.get('/checkAdmin/:userId',async(req,res)=>{
	try {
		const response = await User.findOne({_id:req.params.userId})
		console.log('response',response.isAdmin);
		return res.status(200).send(response.isAdmin)
	} catch (error) {
		return res.status(500).send(error)
	}
})
router.post("/signup", async (req, res) => {
	try {
		// const { error } = validateUser(req.body);
		// if (error)
		// 	return res.status(400).send({ message: error.details[0].message });

		let user = await User.findOne({ email: req.body.email });
		if (user)
			return res
				.status(409)
				.send({ message: "User with given email already Exist!" });

		const salt = await bcrypt.genSalt(Number(process.env.SALT));
		const hashPassword = await bcrypt.hash(req.body.password, salt);

		user = await new User({ ...req.body, password: hashPassword }).save();

        const token = await new Token({
			userId: user._id,
			token: crypto.randomBytes(32).toString("hex"),
		}).save();
		const url = `http://localhost:3000/user/${user.id}/verify/${token.token}`;
		await sendEmail(user.email, "Verify Email", url);

		res.status(201).send({ message: "An Email sent to your account please verify" });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
});

router.post("/login", async (req, res) => {
	try {
		const { error } = validate(req.body);
		if (error)
			return res.status(400).send({ message: error.details[0].message });

		const user = await User.findOne({ email: req.body.email });
		if (!user)
			return res.status(401).send({ message: "Invalid Email or Password" });

		const validPassword = await bcrypt.compare(
			req.body.password,
			user.password
		);
		if (!validPassword)
			return res.status(401).send({ message: "Invalid Email or Password" });
        
        if (!user.verified) {
            let token = await Token.findOne({ userId: user._id });
            if (!token) {
                token = await new Token({
                    userId: user._id,
                    token: crypto.randomBytes(32).toString("hex"),
                }).save();
                const url = `http://localhost:3000/user/${user.id}/verify/${token.token}`;
                await sendEmail(user.email, "Verify Email", url);
            }

            return res
                .status(400)
                .send({ message: "An Email sent to your account please verify" });
        }
		const token = user.generateAuthToken();
		res.status(200).send({ data: token, userId:user._id,userName : user.firstName, message: "Logged in successfully" });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
});

router.get("/:id/verify/:token/", async (req, res) => {
	try {
		const user = await User.findOne({ _id: req.params.id });
		if (!user) return res.status(400).send({ message: "Invalid link" });

		const token = await Token.findOne({
			userId: user._id,
			token: req.params.token,
		});
		if (!token) return res.status(200).send({ message: "Invalid link" });
        console.log('toeknMila:',token);

		await User.updateOne({ _id: user._id}, {$set : {verified: true} });
		// await User.update()
        
		await Token.deleteOne({_id:token._id})
		res.status(200).send({ message: "Email verified successfully" });
	} catch (error) {
		res.status(500).send({ message: "Internal Server Error" });
	}
});

router.post('/otpToEmail',async(req,res)=>{
    try {
        const data = await User.findOne({email : req.body.email})
        if(!data){
            return res.status(400).send({ message: "User with given email does not exist" });
        }
        const otpCode = Math.floor((Math.random()*10000)+1)
        const otpData = new Otp({
            email : req.body.email,
            code : otpCode,
            expireIn : new Date().getTime() + 300*1000
        })
        await otpData.save()
        await sendEmail(req.body.email, "Code for Forget Password", JSON.stringify(otpCode));
        return res.status(200).send({ message: "OTP has send to your email ID" });

    } catch (error) {
        return res.status(500).send({ message: "Internal Server Error" });

    }
})
router.post('/changePassword',async(req,res)=>{
    try {
        const data = await Otp.findOne({code : req.body.otpCode})
        if(!data){
            return res.status(400).send({ message: "Invalid Code, Try Again" });
        }
        const currentTime = new Date().getTime()
        const diff = data.expireIn - currentTime
        if(diff < 0){
            return res.status(400).send({ message: "Code Expires, Try Again" });
        }
        if(req.body.password !== req.body.cpassword){
            return res.status(400).send({ message: "Password does not match" });

        }
        const user = await User.findOne({email : data.email})
        const salt = await bcrypt.genSalt(Number(process.env.SALT));
		const hashPassword = await bcrypt.hash(req.body.password, salt);
        user.password = hashPassword
        await user.save()
        return res.status(200).send({ message: "Password Reset Successfull." });

    } catch (error) {
        return res.status(500).send({ message: "Internal Server Error" });

    }
})
const validate = (data) => {
	const schema = Joi.object({
		email: Joi.string().email().required().label("Email"),
		password: Joi.string().required().label("Password"),
	});
	return schema.validate(data);
};

module.exports = router;