import { asynchandler } from "../utils/asynchandler.js";
import { apierror } from "../utils/apierror.js"; 
import {apiresponse} from "../utils/apiresponse.js"
import { User } from "../models/userSchema.js";
// import  response from "express";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAccessTokenrefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        if (!user) {
            throw new apierror(404, "user not found while generating tokens ")
        }

        const AccessToken = user.generateAccessToken()
        const RefreshToken = user.generateRefreshToken()

        user.refreshToken = RefreshToken
        await user.save({ validateBeforeSave: false })

        return { AccessToken, RefreshToken }

    } catch (error) {
        throw new apierror(505, "something went wrong while generatign refresh and access Token ")
    }
}

const registerUser = asynchandler(async (req, res, next) => {
    //take the user details from the forntend 
    //validate the user details 
    // check if the fields are empty or not 
    // check if user already existed 
    // create a obeject in db 
    // remove the password and refresh token  from the fields for security 
    // check user created 
    //req response 

    const { fullname, email, username, password } = req.body

    if (
        [fullname, email, username, password].some((field) => !field?.trim() )){
        throw new apierror(400, "all fields are required ")
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (existedUser) {
        throw new apierror(401, "user alredy exist ")
    }

    const user = await User.create({
        fullname,
        username: username.toLowerCase(),
        email,
        password
    })

    const userCreated =  await User.findById(user._id).select(
        "-password -refreshToken")

    if (!userCreated) {
        throw new apierror(500, "something went wrong while registering the user ")
    }

    res.status(201).json(
        new apiresponse(200, userCreated, "user register successfully ")
    )

})

const loginUser = asynchandler(async (req, res, next) => {
    // req.boyd ==> data
    // find user 
    // if not found throw error
    // check password 
    // accesstoken and refreshtoken
    // send cookies 

    const { email, username, password } = req.body

  
    if (!email && !username) {
        throw new apierror(404, "email  or username required")
    }

    const findUser = await User.findOne({
        $or: [{ email }, { username }]
    }).select("+password")

    if (!findUser) {
        throw new apierror(404, "user not found please register")
    }



    const passwordcheck = await findUser.isPasswordCorrect(password)

    if (!passwordcheck) {
        throw new apierror(404, "the password is wrong ")
    }

    const { AccessToken, RefreshToken } = await generateAccessTokenrefreshToken(findUser._id)

    const loggedUser = await User.findById(findUser._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
      secure: process.env.NODE_ENV === "production"
    }

    return res.status(201)
        .cookie("accessToken", AccessToken, options)
        .cookie("refreshToken", RefreshToken, options)
        .json(
            new apiresponse(200, {
                user: loggedUser, AccessToken, RefreshToken
            },
                "logged in successfully"
            )
        )

})

const logoutUser = asynchandler(async (req, res, next) => {
    await User.findByIdAndUpdate(
        req.user._id ,{
            $unset :{
                refreshToken : 1
            }
        },{
            new :true 
        }
    )

    const options = {
        httpOnly : true ,
        secure: process.env.NODE_ENV === "production" 
    }
  
    return res
    .status(200)
    .clearCookie("accessToken" , options)
    .clearCookie("refreshToken" , options)
    .json(
        new apiresponse(200 ,{} , "user is loggedout successfully ")    )




})

const refreshtoken = asynchandler(async (req, res, next) => {
    const incomingrefreshToken = req.cookies.refreshToken || req.body.RefreshToken

    if (!incomingrefreshToken) {
        throw new apierror(401, " unauthoroized request")
    }


    try {
        const decodeToken = jwt.verify(incomingrefreshToken, process.env.REFRESH_TOKEN);

        const user = await User.findById(decodeToken?._id);

        if (!user) {
            throw new apierror(404, "the user is not found in a db ");
        }

        if (incomingrefreshToken !== user.refreshToken) {
            throw new apierror(401, "the refreh toekn is user or expired")
        }

        const options = {
            httpOnly: true,
       secure: process.env.NODE_ENV === "production"
        }

        const { AccessToken, RefreshToken } = await generateAccessTokenrefreshToken(user._id)

        return res
            .cookie("accessToken", AccessToken, options)
            .cookie("refreshToken", RefreshToken, options)
            .json(
                new apiresponse(200, {AccessToken, RefreshToken}, "the access token is refreshed successfully ")
            )

    } catch(error) {
    throw  new apierror(401 , error?.message  || "invalid refresh token "  )
    }
})

export {
    generateAccessTokenrefreshToken ,
    registerUser ,
    loginUser ,
    logoutUser,
    refreshtoken
}
