const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
//lists all dishes from dish array
function list(req, res, next)  {
  res.json({ data: orders });
};
//returns single order from orders array
function read (req, res, next){
  res.json({ data: res.locals.order });
};
//makes a new order assigning an id (stays the same if its present and matching)
function create(req, res, next) {
  let newId = nextId();
  const newOrder = {
    id: newId,
    ...res.locals.newOrder,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
};
//changes the order info by finding the order within the orders array
//and setting it equal to our new order obj
function update(req, res, next){
  const newOrder = res.locals.newOrder;
  const orderIndex = orders.findIndex((order) => order.id == newOrder.id);
  orders[orderIndex] = newOrder;
  res.json({ data: newOrder });
};
//ensures order hasnt been delivered
function deliverToCheck(req, res, next) {
  const { data: order } = req.body;
  if (!order.deliverTo) {
    return next({
      status: 400,
      message: `Order must include a deliverTo`,
    });
  }
  res.locals.orderToCheck = order;
  next();
};
//mobile number present
function mobileNumberCheck(req, res, next){
  const order = res.locals.orderToCheck;
  if (!order.mobileNumber) {
    return next({
      status: 400,
      message: `Order must include a mobileNumber`,
    });
  }
  next();
};
//dishes are present and more thatn 0
function dishesCheck(req, res, next) {
  const order = res.locals.orderToCheck;
  if (!order.dishes) {
    return next({
      status: 400,
      message: `Order must include a dish`,
    });
  } else if (order.dishes.length < 1 || !Array.isArray(order.dishes)) {
    return next({
      status: 400,
      message: `Order must include at least one dish`,
    });
  }
  next();
};
//checks dishes for valid quantity
function quantityCheck(req, res, next){
  const order = res.locals.orderToCheck;
  order.dishes.forEach((dish, index) => {
    if (
      !dish.quantity ||
      typeof dish.quantity !== "number" ||
      dish.quantity < 1
    ) {
      return next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0`,
      });
    }
  });
  next();
};
//sets new order to the order we just checked
function postPropertiesAreValid (req, res, next) {
  res.locals.newOrder = res.locals.orderToCheck;
  next();
};
//check for matching id in the orders array
function idMatchCheck (req, res, next) {
  const { data: order } = req.body;
  const { orderId } = req.params;
  const newOrder = res.locals.orderToCheck;
  if (order.id) {
    if (newOrder.id != orderId) {
      return next({
        status: 400,
        message: `Order id does not match route id. Order: ${order.id}, Route: ${orderId}.`,
      });
    }
  }
  next();
};
//ensure that status is pending if we are going to change the order
function statusCheck (req, res, next){
  const order = res.locals.orderToCheck;
  if (!order.status || order.status.length < 1 || order.status === "invalid") {
    return next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
    });
  } else if (order.status === "delivered") {
    return next({
      status: 400,
      message: `A delivered order cannot be changed`,
    });
  }
  next();
};
//sets id (only changes if its different form url id)
function updateIsValid(req, res, next) {
  const { orderId } = req.params;
  const newOrder = res.locals.orderToCheck;
  newOrder.id = orderId;
  res.locals.newOrder = { ...newOrder };
  next();
};
//checks for id and sets index (to be used for destroy function)
function idValidation (req, res, next) {
  const { orderId } = req.params;

  const foundOrder = orders.find((order) => order.id == orderId);
  const index = orders.findIndex((order) => order.id == orderId);
  if (foundOrder) {
    res.locals.order = foundOrder;
    res.locals.index = index;

    return next();
  }

  next({
    status: 404,
    message: `order does not exist: ${orderId}.`,
  });
};
//ensures the status is pending 
function deleteValidation (req, res, next) {
  const { orderId } = req.params;
  const foundOrder = orders.find((order) => order.id == orderId);
  if (foundOrder.status !== "pending") {
    return next({
      status: 400,
      message: `An order cannot be deleted unless it is pending`,
    });
  }
  next();
};
//finds the order and splices it out of the original array
function destroy (req, res, next) {
  const index = res.locals.index;
  if (index > -1) {
    orders.splice(index, 1);
  }
  res.sendStatus(204);
};

module.exports = {
  list,
  read: [idValidation, read],
  create: [
    deliverToCheck,
    mobileNumberCheck,
    dishesCheck,
    quantityCheck,
    postPropertiesAreValid,
    create,
  ],
  update: [
    idValidation,
    deliverToCheck,
    mobileNumberCheck,
    dishesCheck,
    quantityCheck,
    postPropertiesAreValid,
    idMatchCheck,
    statusCheck,
    updateIsValid,
    update,
  ],
  delete: [idValidation, deleteValidation, destroy],
};
