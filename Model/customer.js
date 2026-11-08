const mongoose=require("mongoose");

const customerSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        lowercase:true
    },
    phone:{
        type:String,
        required:true,
        trim:true,
        max:11,
        min:10
    },
    followUps:[{
        dueDate:{
            type:String,
            required:true
        },
        completedAt:{
            type:Date,
            default:null
        },
        createdAt:{
            type:Date,
            default:Date.now
        }
    }],
    debt:[{
        amount:{
            type:Number,
            required:true
        },
        amountRem:{
            type:Number,
            required:true
        },
        
        items:{
            type:String,
            required:true,
            lowercase:true
        },
        date: {
            type:Date,
            default: Date.now()
        }
        
    }],
        payment:[{
            amountPaid:{
                type:Number,
                default:0 
            },
               datePaid: {
                type: Date,
                default: Date
            }
        }]
    
})
module.exports=mongoose.model("Customer",customerSchema);