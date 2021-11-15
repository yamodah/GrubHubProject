const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
const list = (req,res,next)=>{
    res.json({data:orders})
}
const read = (req,res,next)=>{
    res.json({data:res.locals.order})
}
const create = (req,res,next)=>{
    let newId = nextId()
    const newOrder = {
        id:newId,
        ...res.locals.newOrder
    }
    orders.push(newOrder)
    res.status(201).json({data:newOrder})
}
const update = (req,res,next)=>{
    const newOrder = res.locals.newOrder
    const orderIndex = orders.findIndex((order)=>order.id == newOrder.id)
    orders[orderIndex]= newOrder
    res.json({data:newOrder})
}
const postValidation = (req,res,next)=>{
    const {data:order} = req.body
    if(!order.deliverTo){
        next({
            status: 400,
            message: `Order must include a deliverTo`,
          })
    }else if(!order.mobileNumber){
        next({
            status: 400,
            message: `Order must include a mobileNumber`,
          })
    }else if(!order.dishes){
        next({
            status: 400,
            message: `Order must include a dish`,
          })
    }else if(order.dishes.length < 1 || !Array.isArray(order.dishes)){
        //console.log(order.dishes, order.dishes.length,typeof order.dishes, Array.isArray(order.dishes))
        next({
            status: 400,
            message: `Order must include at least one dish`,
          })
    }
    order.dishes.forEach((dish,index)=>{
        //console.log(dish)
        if (!dish.quantity||typeof dish.quantity!== "number" ||dish.quantity<1){
            //console.log(dish.quantity)
             next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`,
              })
            }
        })
     
    res.locals.newOrder = order
    next()
}

const updateValidation = (req,res,next)=>{
    const {orderId} = req.params
    const newOrder = res.locals.newOrder
    const oldOrder = res.locals.order
    const {data:order} = req.body
    //console.log(order.status)
    if(order.id){
    //console.log(`this is the req.body id ${id}`, `this is the dishId from params ${dishId}`)
        if(newOrder.id != orderId) {
            next({
            status: 400,
            message: `Order id does not match route id. Order: ${order.id}, Route: ${orderId}.`,
            })}
    }
     if(!order.status||order.status.length<1||order.status === "invalid"){
       // console.log("status is missing")
        next({
            status: 400,
            message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
          })
    }else if(order.status === "delivered"){
        //console.log("status is delivered")
        next({
            status: 400,
            message: `A delivered order cannot be changed`,
          })
    }
    //console.log("id",dishId)
    newOrder.id = orderId
    res.locals.newOrder = {...newOrder};
    
    //console.log(`this is the req.body id ${id}`, `this is the dishId from params ${dishId}`)
    next()
}
const idValidation = (req,res,next)=>{
    const {orderId} = req.params
    const foundOrder = orders.find((order)=>order.id == orderId)
    if(foundOrder===undefined){
        return next({
            status: 404,
            message: `order does not exist: ${orderId}.`,
          })
    }
    //console.log(foundOrder)
      res.locals.order = foundOrder
      console.log(res.locals.order)
        return next()
}
const deleteValidation = (res,req,next) =>{
    const {orderId} = req.params
    const foundOrder = orders.find((order)=>order.id == orderId)
    if(foundOrder.status!=="pending"){
        next({
            status: 404,
            message: `An order cannot be deleted unless it is pending`,
          })
    }
    next()
}
const destroy = (res,req,next)=>{
    console.log("starting to delete")
    const {orderId} = req.params
    const index = orders.findIndex((order) => order.id == orderId );
    if (index > -1) {
        console.log("deleting")
      orders.splice(index, 1);
      console.log("deleted")
    }
    res.sendStatus(204)
}

module.exports = {
    list,
    read:[idValidation,read],
    create:[postValidation,create],
    update:[idValidation,postValidation,updateValidation,update],
    delete:[idValidation,deleteValidation,destroy]

}