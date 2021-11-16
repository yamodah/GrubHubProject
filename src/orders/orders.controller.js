const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
const list = (req, res, next) => {
  res.json({ data: orders });
};
const read = (req, res, next) => {
  res.json({ data: res.locals.order });
};
const create = (req, res, next) => {
  let newId = nextId();
  const newOrder = {
    id: newId,
    ...res.locals.newOrder,
  };
  orders.push(newOrder);
  res.status(201).json({ data: newOrder });
};
const update = (req, res, next) => {
  const newOrder = res.locals.newOrder;
  const orderIndex = orders.findIndex((order) => order.id == newOrder.id);
  orders[orderIndex] = newOrder;
  res.json({ data: newOrder });
};
const deliverToCheck = (req, res, next) => {
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
const mobileNumberCheck = (req, res, next) => {
  const order = res.locals.orderToCheck;
  if (!order.mobileNumber) {
    return next({
      status: 400,
      message: `Order must include a mobileNumber`,
    });
  }
  next();
};
const dishesCheck = (req, res, next) => {
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
const quantityCheck = (req, res, next) => {
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
const postPropertiesAreValid = (req, res, next) => {
  res.locals.newOrder = res.locals.orderToCheck;
  next();
};
const idMatchCheck = (req, res, next) => {
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
const statusCheck = (req, res, next) => {
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
const updateIsValid = (req, res, next) => {
  const { orderId } = req.params;
  const newOrder = res.locals.orderToCheck;
  newOrder.id = orderId;
  res.locals.newOrder = { ...newOrder };
  next();
};

const idValidation = (req, res, next) => {
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
const deleteValidation = (req, res, next) => {
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
const destroy = (req, res, next) => {
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
