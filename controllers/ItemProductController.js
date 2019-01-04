var Request = require("request");
var ItemProduct = require('../models/ItemProduct');

module.exports = {
    // ======= GET =========
    getItemProducts: function (req, res) {
        ItemProduct.find()
            .populate('childrenProducts')
            .exec(function (err, itemProducts) {
                if (err)
                    res.send(err);

                res.json(itemProducts);
            });
    },

    getItemProductById: function (req, res) {
        ItemProduct.findById(req.params.id, function (err, itemProduct) {
            if (err) {
                if (err.name === "CastError")
                    res.send(JSON.parse('{"message":"ID is invalid or wasn\'t found."}'));
                else
                    res.send(err);
            }

            res.json(itemProduct);
        })
    },

    // ======= POST =======
    createItemProduct: function (req, res) {
        Request.get({
            "headers": { "content-type": "application/json" },
            "url": "https://iteracao1.azurewebsites.net/api/Product/" + req.body.productId
        }
            , (err, response, body) => {

                if (response.statusCode == 200 || response.statusCode == 201){
                    data = JSON.parse(body);

                    var itemProduct = new ItemProduct();

                    itemProduct.productId = req.body.productId;
                    itemProduct.name = data.name;
                    itemProduct.price = data.price;
                    
                    // Check Children
                    var children = req.body.childrenProducts;
                    console.log(children);
                    
                    if(children == undefined || children.length == 0) {
                        console.log("1");
                        itemProduct.childrenProducts = [];
                    } else {
                        console.log("2");
                        itemProduct.childrenProducts = children;
                    }

                    console.log(children);
                    console.log(itemProduct.childrenProducts);

                    // Check Materials
                    var isMaterialValid = false;
                    if(data.materialsID.length > 0) {
                        data.materialsID.forEach(material => {
                            if(material == req.body.materialId)
                                isMaterialValid = true;
                        });
                    }

                    if(!isMaterialValid) {
                        res.status(400).json({ message: 'Material is invalid!' });
                        return;
                    }

                    itemProduct.materialId = req.body.materialId;
                    console.log("mat:" + req.body.materialId);
                    
                    // Check Finishing
                    itemProduct.finishingId = req.body.finishingId;
                    console.log("fin:" + req.body.finishingId);
                    
                    // Check Dimensions
                    if (CheckDimension(data.dimensions, req.body.width, req.body.height, req.body.depth)){
                        itemProduct.width = req.body.width;
                        itemProduct.height = req.body.height;
                        itemProduct.depth = req.body.depth;
                    } else {
                        res.status(400).json({ message: 'The dimensions are invalid!' });
                        return;
                    }
                    
                    console.log(itemProduct);

                    itemProduct.save(function (err) {                       
                        console.log("aaa");
                        
                        if (err) {
                            res.send(err);
                            return;
                        }

                        res.status(201).json({ message: 'Item Product created!', itemProductID: itemProduct._id });
                        return;
                    });
                } else {
                    res.status(400).json({ message: 'The product Id doesn\'t exist!' });
                    return;
                }
                
        });
    },

    // ======= PUT =======
    updateItemProduct: function (req, res) {
        ItemProduct.findById(req.params.id, function (err, itemProduct) {
            if (err) {
                if (err.name === "CastError")
                    res.send(JSON.parse('{"message":"ID is invalid or wasn\'t found."}'));
                else
                    res.send(err);
            }

            itemProduct.name = req.body.name;
            itemProduct.price = req.body.price;
            itemProduct.productId = req.body.productId;
            itemProduct.childrenProducts = req.body.childrenProducts;
            itemProduct.width = req.body.width;
            itemProduct.height = req.body.height;
            itemProduct.depth = req.body.depth;


            itemProduct.save(function (err) {
                if (err)
                    res.send(err);

                res.json({ message: 'Item Product updated!' });
            });
        })
    },

    // ======= DELETE =======
    deleteItemProduct: function (req, res) {
        ItemProduct.remove({
            _id: req.params.id
        }, function (err, itemProduct) {
            if (err) {
                if (err.name === "CastError")
                    res.send(JSON.parse('{"message":"ID is invalid or wasn\'t found."}'));
                else
                    res.send(err);
            }

            res.json({ message: 'Successfully deleted' });
        });
    }
}

function CheckDimension(dimensions, width, height, depth){
    var tmp = 0;
    dimensions.forEach(element => {
        tmp = 0;

        if (element.width.length == 2){
            if (element.width[0] <= width && element.width[1] >= width){
                tmp++;
            }
        }else{
            if (element.width[0] == width){
                tmp++;
            }
        }

        if (element.height.length == 2){
            if (element.height[0] <= height && element.height[1] >= height){
                tmp++;
            }
        }else{
            if (element.height[0] == height){
                tmp++;
            }
        }

        if (element.depth.length == 2){
            if (element.depth[0] <= depth && element.depth[1] >= depth){
                tmp++;
            }
        }else{
            if (element.depth[0] == depth){
                tmp++;
            }
        }

        if (tmp == 3)
            return;
    });
    
    if (tmp == 3){
        return true;
    }
    return false;
}