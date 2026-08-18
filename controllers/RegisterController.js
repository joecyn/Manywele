const bcrypt=require("bcrypt")
const Joi =require("joi")
const User=require("../Model/Users")
const jwt =require("jsonwebtoken")

const RegisterController = async (req, res, next) => {
    // creating JWT token
    const maxAge = 3 * 24 * 60 * 60; // 3 days in seconds
    const createToken = (payload) => {
        if (!process.env.SECRET) throw new Error('JWT secret not configured');
        return jwt.sign(payload, process.env.SECRET, { expiresIn: maxAge });
    };
    const schema=Joi.object().keys({
        name:Joi.string().min(6).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(8).max(20).required(),
        // _csrf: Joi.string().optional(),
        confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({ 'any.only': 'Passwords do not match' })

    } )
    const { _csrf, ...body } = req.body;
    const { error, value } = schema.validate(body);
    // const { name, email, password } = req.body;
    // const result = schema.validate(req.body)
    console.log(error)
    
    if (error) {
        const Message =error.details && error.details[0] && error.details[0].message ? error.details[0].message : 'FAILED: Please check your details and try again';
        //console.log(Message)
        return res.render('pages/Register', { Message: Message, user: null, title: 'Register' });
    }
    else{
        const findUser= await User.findOne({email:req.body.email})
        const username=await User.findOne({name:req.body.name})
        if (findUser || username) {
            const Message = 'User already Exists. Please Login';
            return res.render('pages/Register', { Message: Message, user: null, title: 'Register' });
        }
        else{

                try{
                                const hashedPassword = await bcrypt.hash(req.body.password, 10);
                                
                                const newUser = await User.create({ name: req.body.name, email: req.body.email, password: hashedPassword });
                                // create token
                                const token = createToken({ id: newUser._id, name: newUser.name });
                                res.cookie('jwt', token, {

                                    httpOnly: true,
                                    maxAge: maxAge * 1000,
                                    secure: process.env.NODE_ENV === 'production',
                                    sameSite: 'Lax',
                                });
                                return res.redirect('/Login');
                }
                catch(err){
                    console.log(err)
                
                }
        }
    
        
    }
    
    
}
module.exports=RegisterController