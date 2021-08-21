const path = require("path");
// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));
// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

function dishExists(req, res, next) {
    const dishId = req.params.dishId;
    let foundDish = dishes.find((dish) => dish.id === dishId);

    if (foundDish === undefined) {
        return next({
            status: 404,
            message: `Dish does not exist: ${dishId}`,
        });
    }
    res.locals.dish = foundDish;
    next();
}

function validation(req, res, next) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    if (
        name &&
        description &&
        price &&
        price > 0 &&
        typeof price === "number" &&
        image_url
    ) {
        return next();
    }
    const invalidType = !name
        ? "name"
        : !description
        ? "description"
        : !price || price <= 0 || typeof price !== "number"
        ? "price"
        : "image_url";
    next({
        status: 400,
        message: `Dish must include a ${invalidType}.`,
    });
}

function update(req, res, next) {
    let dish = res.locals.dish;
    const originalDishId = dish.id;
    const { data: { id, name, description, price, image_url } = {} } = req.body;

    if (originalDishId === id || !id) {
        const updateDish = {
            id: dish.id,
            name,
            description,
            price,
            image_url,
        };
        dish = updateDish;
        res.json({ data: dish });
    }

    next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${originalDishId}`,
    });
}

function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function read(req, res) {
    const dish = res.locals.dish;
    res.json({ data: res.locals.dish });
}

function list(req, res) {
    res.json({ data: dishes });
}

module.exports = {
    list,
    read: [dishExists, read],
    create: [validation, create],
    update: [dishExists, validation, update],
};
