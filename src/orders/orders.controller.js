const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

function orderExists(req, res, next) {
    const orderId = req.params.orderId;
    let foundOrder = orders.find((order) => order.id === orderId);

    if (foundOrder === undefined) {
        return next({
            status: 404,
            message: `Matching order not found: ${orderId}`,
        });
    }
    res.locals.order = foundOrder;
    next();
}

function dishesPropertyIsAnArray(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    Array.isArray(dishes)
        ? next()
        : next({ status: 400, message: "Order must have at least one dish" });
}

function dishesArrayHasDishQuantity(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    const index = dishes.findIndex((dish) => !dish.quantity);
    index != -1
        ? next({
              status: 400,
              message: `Dish ${index} must have a quantity that is an integer greater than 0`,
          })
        : next();
}

function dishQuantityIsGreaterThanZero(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    const index = dishes.findIndex((dish) => dish.quantity <= 0);
    index != -1
        ? next({
              status: 400,
              message: `Dish ${index} must have a quantity that is an integer greater than 0`,
          })
        : next();
}

function dishQuantityIsAnInteger(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    const index = dishes.findIndex((dish) => !Number.isInteger(dish.quantity));
    index != -1
        ? next({
              status: 400,
              message: `Dish ${index} must have a quantity that is an integer greater than 0`,
          })
        : next();
}

function statusIsInvalid(req, res, next) {
    const { data: { status } = {} } = req.body;
    status === "pending" ||
    status === "preparing" ||
    status === "out-for-delivery"
        ? next()
        : next({
              status: 400,
              message: `Order must have a status of pending, preparing, out-for-delivery, delivered`,
          });
}

function statusIsDelivered(req, res, next) {
    const { data: { status } = {} } = req.body;
    status === "delivered"
        ? next({ status: 400, message: `A delivered order cannot be changed` })
        : next();
}

function orderIdDoesNotMatchDataId(req, res, next) {
    const { data: { id } = {} } = req.body;
    const order = res.locals.order;
    if (!id || id === "" || id === null || id === undefined) {
        return next();
    }
    id === order.id
        ? next()
        : next({
              status: 400,
              message: `Order id does not match route id. Order: ${id}, Route: ${order.id}.`,
          });
}

function validation(req, res, next) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    if (deliverTo && mobileNumber && dishes && dishes.length > 0) {
        return next();
    }
    const invalidType = !deliverTo
        ? "deliverTo"
        : dishes.length <= 0
        ? "dishes"
        : "mobileNumber";
    next({
        status: 400,
        message: `Order must include a ${invalidType}.`,
    });
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes,
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function update(req, res, next) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    let order = res.locals.order;
    const updateOrder = {
        id: order.id,
        deliverTo,
        mobileNumber,
        status,
        dishes,
    };
    res.json({ data: updateOrder });
}

function read(req, res) {
    const order = res.locals.order;
    res.json({ data: res.locals.order });
}

function list(req, res) {
    res.json({ data: orders });
}

function destroy(req, res, next) {
    const order = res.locals.order;
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    if (index > -1 && order.status === "pending") {
        orders.splice(index, 1);
    } else {
        return next({
            status: 400,
            message: "An order cannot be deleted unless it is pending",
        });
    }
    res.sendStatus(204);
}

module.exports = {
    list,
    read: [orderExists, read],
    create: [
        dishesPropertyIsAnArray,
        dishesArrayHasDishQuantity,
        dishQuantityIsGreaterThanZero,
        dishQuantityIsAnInteger,
        validation,
        create,
    ],
    update: [
        orderExists,
        dishesPropertyIsAnArray,
        dishesArrayHasDishQuantity,
        dishQuantityIsGreaterThanZero,
        dishQuantityIsAnInteger,
        statusIsInvalid,
        statusIsDelivered,
        orderIdDoesNotMatchDataId,
        validation,
        update,
    ],
    delete: [orderExists, destroy],
};
