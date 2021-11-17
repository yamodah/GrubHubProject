const { type } = require("os");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
const { post } = require("./dishes.router");

// TODO: Implement the /dishes handlers needed to make the tests pass
function list (req, res, next) {
  res.json({ data: dishes });
};
function read (req, res, next){
  res.json({ data: res.locals.dish });
};
function create (req, res, next) {
  let newId = nextId();
  const newDish = {
    id: newId,
    ...res.locals.newDish,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
};
function update (req, res, next)  {
  const newDish = res.locals.newDish;
  const dishIndex = dishes.findIndex((dish) => dish.id == newDish.id);
  dishes[dishIndex] = newDish;
  res.json({ data: newDish });
};
function nameCheck(req, res, next) {
  const { data: dish } = req.body;

  if (!dish.name) {
    return next({
      status: 400,
      message: `Dish must include a name`,
    });
  }
  res.locals.dishToValidate = dish;
  next();
};
function descriptionCheck (req, res, next){
  const dish = res.locals.dishToValidate;
  if (!dish.description) {
    return next({
      status: 400,
      message: `Dish must include a description`,
    });
  }
  next();
};
function priceCheck (req, res, next) {
  const dish = res.locals.dishToValidate;
  if (!dish.price) {
    return next({
      status: 400,
      message: `Dish must include a price`,
    });
  } else if (dish.price <= 0 || typeof dish.price !== "number") {
    return next({
      status: 400,
      message: `Dish must have a price that is an integer greater than 0`,
    });
  }
  next();
};
function image_urlCheck (req, res, next) {
  const dish = res.locals.dishToValidate;
  if (!dish.image_url) {
    next({
      status: 400,
      message: `Dish must include a image_url`,
    });
  }
  next();
};
function postPropertiesAreValid (req, res, next)  {
  res.locals.newDish = res.locals.dishToValidate;
  next();
};
function updateValidation  (req, res, next) {
  const { dishId } = req.params;
  const newDish = res.locals.newDish;
  const oldDish = res.locals.dish;
  const {
    data: { id },
  } = req.body;
  if (id) {
    return newDish.id == dishId
      ? next()
      : next({
          status: 400,
          message: `Dish id does not match route id. Dish: ${newDish.id}, Route: ${dishId}`,
        });
  }

  newDish.id = dishId;
  res.locals.newDish = { ...newDish };

  next();
};
function idValidation(req, res, next){
  const { dishId } = req.params;
  const foundDish = dishes.find((dish) => dish.id === dishId);
  if (foundDish) {
    res.locals.dish = foundDish;
    return next();
  }
  next({
    status: 404,
    message: `Dish does not exist: ${dishId}.`,
  });
};

module.exports = {
  list,
  read: [idValidation, read],
  create: [
    nameCheck,
    descriptionCheck,
    priceCheck,
    image_urlCheck,
    postPropertiesAreValid,
    create,
  ],
  update: [
    idValidation,
    nameCheck,
    descriptionCheck,
    priceCheck,
    image_urlCheck,
    postPropertiesAreValid,
    updateValidation,
    update,
  ],
};
