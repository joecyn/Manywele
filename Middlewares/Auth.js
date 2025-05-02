
const jwt=require("jsonwebtoken")
const isAuthenticated= (req,res,next)=>{
    try{
    const token=req.cookies.jwt
       
        if(token){
            
            jwt.verify(token,process.env.SECRET,async(err,user)=>{
                if(err){
                    res.redirect("/Login")
                }
                else{
                    
                    req.user=user;
                    next(); 
                }
            })
        }
        else{
            
            
            res.redirect("/Login")
            
        }

    }
    catch(err){
        console.log(err)
    }
}
module.exports=isAuthenticated;