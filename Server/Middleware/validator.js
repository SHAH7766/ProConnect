import express from 'express'
import jwt from 'jsonwebtoken'
export const RegisterValidator = async(req,res,next)=>{
    try {
        const {name,email,password}=req.body
        const errors=[]
        if(!name)
            errors.push("username is missing")
        if(!email)
            errors.push("email is missing")
        if(!password)
            errors.push("password is missing")
        if (errors.length > 0)
            return res.send({errors:errors,success:false})
        next()    
    } catch (error) {
        return res.status(501).send({Message:"Internal server error",success:false})
    }
}
export const VerifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(" ")[1];        
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        
        console.log("Decoded Payload:", decoded); // DEBUG 2
        
        req.user = decoded.LoggedUser || decoded.LoggedProvider; 
        next();
    } catch (err) {
        return res.status(401).send({ Message: "Invalid Token", success: false });
    }
}