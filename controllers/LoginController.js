const User=require("../Model/Users")
const bcrypt=require("bcrypt");
const jwt = require("jsonwebtoken")

const LoginController = async (req, res) => {
    // creating JWT token
    const maxAge = 3 * 24 * 60 * 60; // 3 days in seconds

    const createToken = (payload) => {
        if (!process.env.SECRET) throw new Error('JWT secret not configured');
        return jwt.sign(payload, process.env.SECRET, { expiresIn: maxAge });
    };
    try{
    const{email,password}=req.body;
        if (!email || !password) {
            const Message = 'All fields are required!';
            return res.render('pages/Login', { Message: Message, user: null, title: 'Login' });
        }
    
    else{
        const findUser= await User.findOne({email:email})
        if (!findUser) {
            const Message = 'User does not Exist please Register';
            return res.render('pages/Login', { Message: Message, user: null, title: 'Login' });
        }
    

    const match= await bcrypt.compare(password,findUser.password)

        if (!match) {
            const Message = 'Invalid password or Username';
            return res.render('pages/Login', { Message: Message, user: null, title: 'Login' });
        }

        const token = createToken({ id: findUser._id, name: findUser.name });
        res.cookie('jwt', token, {
            httpOnly: true,
            maxAge: maxAge * 1000,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
        });
        return res.redirect('/');
    
    }
    
    }
    catch(err){
        console.log(err)
    }
    

}
module.exports=LoginController;
