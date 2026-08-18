const express=require("express");
const router=express.Router();
const isAuthenticated=require("../Middlewares/Auth")
const Customer=require("../Model/customer")
const User = require("../Model/Users")
const rateLimit=require("../Middlewares/rateLimit")
const Joi = require('joi');
//const Users=require("../Model/Users");
const LoginController=require("../controllers/LoginController")
const RegisterController=require("../controllers/RegisterController")
//let message;
let maxAge=10*60;
//Login
router.get("/Login",(req,res)=>{
    const Message=""
   res.render("pages/Login",{Message:Message,user:null,title:"Login"})
   })

router.post("/Login",LoginController)

//Register
router.get("/Register",(req,res)=>{
    const Message =" "
    res.render("pages/Register",{Message:Message, title:"" })
})
router.post("/Register",RegisterController)

//SIGNOUT ROUTE
router.get("/SignOut",isAuthenticated,(req,res)=>{
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax'
    });
    res.redirect('/Login');
}
)
// Home route
router.get('/', isAuthenticated, async (req, res, next) => {
    try {
        const user = req.user;
        const searchTerm = typeof req.query.search === 'string' ? req.query.search.trim() : '';

        // pagination params
        const pageSize = 5; // items per page
        let page = parseInt(req.query.page, 10) || 1;
        if (Number.isNaN(page) || page < 1) page = 1;

        const baseFilter = { 'debt.0': { $exists: true } };
        const customerFilter = searchTerm
            ? { ...baseFilter, name: { $regex: new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') } }
            : baseFilter;

        const totalCustomersCount = await Customer.countDocuments(customerFilter);
        const totalPages = Math.max(1, Math.ceil(totalCustomersCount / pageSize));
        if (page > totalPages) page = totalPages;

        // fetch only the page of customers with debts
        const customers = await Customer.find(customerFilter)
            .sort({ _id: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize);

        // compute totals across all customers using aggregation
        const owedAgg = await Customer.aggregate([
            { $unwind: { path: '$debt', preserveNullAndEmptyArrays: false } },
            { $group: { _id: null, totalOwed: { $sum: '$debt.amountRem' } } }
        ]);
        const totalOwed = (owedAgg[0] && owedAgg[0].totalOwed) ? owedAgg[0].totalOwed : 0;

        const paidAgg = await Customer.aggregate([
            { $unwind: { path: '$debt', preserveNullAndEmptyArrays: false } },
            { $match: { 'debt.amountRem': { $lte: 0 } } },
            { $count: 'totalFullyPaid' }
        ]);
        const totalFullyPaid = (paidAgg[0] && paidAgg[0].totalFullyPaid) ? paidAgg[0].totalFullyPaid : 0;

        // count customers who have at least one debt (fully paid or not)
        const totalUsers = await Customer.countDocuments({ 'debt.0': { $exists: true } });

        res.render('pages/Home', {
            customers: customers,
            totalOwed: totalOwed,
            user: user,
            title: 'Home',
            showSearch: true,
            totalUsers: totalUsers,
            totalFullyPaid: totalFullyPaid,
            // pagination props
            page: page,
            totalPages: totalPages,
            pageSize: pageSize,
            totalCustomersCount: totalCustomersCount,
            searchTerm: searchTerm
        });
    } catch (err) {
        next(err);
    }

});
//search
router.get('/Search', isAuthenticated, async (req, res, next) => {
    return res.status(403).render('pages/Error', { message: 'Search is only allowed from the Home page' });
});

// Secure POST search with validation and rate limiting
router.post('/Search', isAuthenticated, rateLimit({ windowMs: 60 * 1000, max: 20 }), async (req, res, next) => {
    const schema = Joi.object({
        name: Joi.string().trim().min(1).max(100).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
        return res.redirect('/');
    }

    try {
        const searchName = encodeURIComponent(value.name);
        return res.redirect(`/?search=${searchName}`);
    } catch (err) {
        return next(err);
    }
});


   

//Adding a debt route
router.get("/Add",isAuthenticated,(req,res)=>{
    const user=req.user
  res.render("pages/Add",{user:user,title:"Add"})
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
        res.render("pages/Details",{customer:customer,totalPayment:totalPayment,user:user,title:"Details"})
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
         
        res.render("pages/Payment",{customer:customer,user:user,title:"Payment"})
        
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
        res.render("pages/Update",{customer:customer,user:user,title:"Update"})
        
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

