//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();


//const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://" + process.env.DB_USER + ":" + process.env.DB_PASS + "@cluster0.q4wvwxe.mongodb.net/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String
});
const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: "Welcome to your to-do list !"
});
const item2 = new Item({
  name: "Hit the + button to add a new item."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find().then(function(foundItems){
    if (foundItems.length ===0){
      Item.insertMany(defaultItems).then(function(){
        console.log("Successfully updated itemsDB");
     }).catch(function(err){
        console.log(err);
     });
     res.redirect("/");
    } else {
    res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
  }).catch(function(err){
    console.log(err);
  });
});

app.get("/:customListName", function(req,res){

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}).then(function(foundList){
    if (!foundList) {
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      list.save();
      res.redirect("/" + customListName);
    } else {
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }
  }).catch(function(err){
    console.log(err);
  });

 
  
});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });
  if (listName === "Today"){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}).then(function(foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+ listName);
    }).catch(function(err){
      console.log(err);
    });
  }
});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkBox;

  const listName = req.body.listName;

  if (listName === "Today"){
      Item.findByIdAndRemove(checkedItemId).then(function(){
        console.log("Item removed successfully");
      }).catch(function(err){
          console.log(err);
      });
      res.redirect("/");
    } else {
      List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(function(foundList){
          res.redirect("/"+ listName);
        }).catch(function(err){
        console.log(err);
      });
    }
  });



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started on port 3000");
});
