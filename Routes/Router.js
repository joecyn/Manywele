const express=require("express");
const router=express.Router();
const isAuthenticated=require("../Middlewares/Auth")
const Customer=require("../Model/customer")
//const Users=require("../Model/Users");
const LoginController=require("../controllers/LoginController")
const RegisterController=require("../controllers/RegisterController")
//let message;
let maxAge=10*60;

//Login Routes
router.get("/Login",(req,res)=>{
    const Message=""
   res.render('pages/Login',{Message:Message})
   })

router.post("/Login",LoginController)

//Register
router.get("/Register",(req,res)=>{
    const Message =" "
    res.render("pages/Register",{Message:Message})
})
router.post("/Register",RegisterController)

//SIGNOUT ROUTE
router.get("/SignOut",isAuthenticated,(req,res)=>{
    res.cookie("jwt"," ",{maxAge:1});
    res.redirect("/Login")
}
)

//Home route
router.get("/",isAuthenticated,async(req,res,next)=>{
   
    try {
        const user=req.user
        const customer= await Customer.find({}).sort({_id:-1})
        
       if(customer){
        const owed=customer
        var totalOwed=0;
         owed.forEach((cust)=>{
            cust.debt.forEach((element)=>{
                totalOwed+=element.amountRem
                //console.log(element.amountRem)
                })
        });
        res.render("pages/Home",{customers:customer,totalOwed:totalOwed,user:user})
             
   
       }
  
    } catch (err) {
        next(err)
    }
   
    
    })

//search
router.get("/Search",isAuthenticated,async(req,res)=>{
  
   const name=req.query.name
   const user=req.user
   

   if(!name){
    const message="Search a Customer from the above  search bar"
    
    res.render("pages/Search",{customer:"",message:message,user:user})
   }
  else{
    try {
        const customer=await Customer.find({name:{$regex : name.toLowerCase()}})
   
        if(customer.length===0){
            const message="Customer not Found."
            res.render("pages/Search",{customer:"",message:message,user:user})
        }
        else if(customer.length>1){
           
            res.render("pages/ManySearch",{customers:customer,user:user})
        }
        else{
            res.render("pages/Search",{customer:customer,user:user})
        }
        
       } catch (err) {
        next(err)
      
        
       }
  }
   
    
})


   

//Adding a debt route
router.get("/Add",isAuthenticated,(req,res)=>{
    const user=req.user
  res.render("pages/Add",{user:user})
})
router.post("/Add",isAuthenticated,async(req,res,next)=>{
    const{name,phone,amount,items,amountPaid}=req.body
    //console.log(req.body)
try {
    await Customer.create({
        name:name,
        phone:phone,
        debt:{
            amount:amount,
            amountRem:amount-amountPaid,
            items:items,

        },
         payment:{
                amountPaid:amountPaid
            
        }

    })
    //console.log("Debt added")
     //message=""
     req.flash('success','Debt Added Successfully');
    res.redirect("/")
} catch (err) {
    next(err)
}

})
//Detail view route
router.get("/Details/:id",isAuthenticated,async(req,res,next)=>{
    const id=req.params.id;
    const user=req.user
    try {
        const customer=await Customer.findById({_id:id}).sort({_id:-1})
        if(!customer){
            next({err:"Record not found"})
        }
        const paid=customer.payment;
        var totalPayment=0;
         paid.forEach((element)=>{
        totalPayment+=element.amountPaid
        })
        res.render("pages/Details",{customer:customer,totalPayment:totalPayment,user:user})
        //res.send(typeof(customer))
    } catch (err) {
        next(err)
        
    }

})

//Making payments
router.get("/Payment/:id",isAuthenticated,async(req,res,next)=>{
    const user=req.user
    const id=req.params.id;
    try {
        const customer=await Customer.findById({_id:id})
         
        res.render("pages/Payment",{customer:customer,user:user})
        
    } catch (err) {
        next(err)
        
    }
    
})

router.post("/Payment/:id",isAuthenticated,async(req,res,next)=>{
    const id=req.params.id;
    const amountRem=req.body.amountRem;
    const pay=req.body.amountPaid;
    const Paid={amountPaid:pay};
    const debtRem=amountRem-pay;
    
    try {
        await Customer.findByIdAndUpdate({_id:id},{$push: { payment:Paid  }})
        //const customer= await Customer.findById({_id:id})
       await Customer.findByIdAndUpdate({_id:id},{$set:{"debt.0.amountRem":debtRem}},{multi:true})
       //await customer.updateOne({$set:{"debt.0.amountRem":debtRem}})
        
        //const message = new URLSearchParams(msg)
      // message=""
       req.flash('success','Payment Successful');
        res.redirect(`/Details/${id}`)
        
    } catch (err) {
        next(err)
        
    }
    
})

//Update route
router.get("/Update/:id",isAuthenticated,async(req,res,next)=>{
    const id=req.params.id;
    const user=req.user
    try {
        const customer=await Customer.findById({_id:id})
        if(!customer){
            next({err: "Record not found"})
        }
        res.render("pages/Update",{customer:customer,user:user})
        
    } catch (err) {
        next(err)
        
    }

})
//Update Route
router.post("/Update/:id",isAuthenticated,async(req,res,next)=>{
    const id=req.params.id;
    const{name,phone,amount,items}=req.body;
    
    //getting the value of all payments made
    const customer=await Customer.findById({_id:id})
    const paid=customer.payment;
    //console.log(paid)
    //console.log(paid[paid.length-1].amountPaid)
    var totalPayment=0;
    paid.forEach((element)=>{
        totalPayment+=element.amountPaid
    })
    //console.log(totalPayment)
    //subtracting total payments from the updated debt amount to get the remender of the debt
    const rem= amount-totalPayment;
    try {
        await Customer.findByIdAndUpdate({_id:id},
            {$set:{
                name:name,
                phone:phone,
                
                "debt.0.amount":amount,
                "debt.0.amountRem":rem,
                "debt.0.items":items,
                
        
            }
        })
        
        req.flash('success','Record Updated Successfully');
        res.redirect("/")
        //res.redirect()
    } catch (err) {
        next(err)
        
    }

})
//Delete route
router.get("/Delete/:id",isAuthenticated,async(req,res,next)=>{
    const id=req.params.id
    try {
        await Customer.findByIdAndDelete({_id:id})
        
        //message="Record Deleted SUccessfully"
        req.flash('success','Record Deleted Successfully');
        res.redirect("/")
        
    } catch (err) {
       next(err)
        
    }

})



//Twilio API 
/**router.get("/Send",(req,res)=>{
    res.render("Pages/Text")
})

router.post("/Send",(req,res)=>{
const Numbers=["+254743402563"]
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const client = require('twilio')(accountSid, authToken);

const {message}=req.body;
Numbers.forEach((number)=>{
    client.messages
  .create({
     body: message,
     from: "+17088477352",
     to: number
   })
  .then(message => res.send(message.body));

})

    
})**/

module.exports=router;

