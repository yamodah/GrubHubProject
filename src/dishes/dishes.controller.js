const { type } = require("os");
const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");
const { post } = require("./dishes.router");

// TODO: Implement the /dishes handlers needed to make the tests pass


//lists all dishes from dishes array
function list (req, res, next) {
  res.json({ data: dishes });
};
//returns singular dish matching dish id
function read (req, res, next){
  res.json({ data: res.locals.dish });
};
//creates new dish and sets dish id if the dish id is the same nothing will change 
function create (req, res, next) {
  let newId = nextId();
  const newDish = {
    id: newId,
    ...res.locals.newDish,
  };
  dishes.push(newDish);
  res.status(201).json({ data: newDish });
};
//updates by finding the dish in the array and setting that to the new dish
function update (req, res, next)  {
  const newDish = res.locals.newDish;
  const dishIndex = dishes.findIndex((dish) => dish.id == newDish.id);
  dishes[dishIndex] = newDish;
  res.json({ data: newDish });
};
//checks for valid name
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
//checks for valid description
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
//checks for valid price
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
//checks for url to be present
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
//sets newdish to the dish we just checked coudl also just be req.body 
function postPropertiesAreValid (req, res, next)  {
  res.locals.newDish = res.locals.dishToValidate;
  next();
};
//checks for id present if it is it must match id in url
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
//checks that id is valid in this array
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
