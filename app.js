const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


// ------------------ Prepare Database for the Web App⏬ ------------------
mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = {
  name: {
    type: String,
    required: true
  }
}

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your ToDo List"
});

const item2 = new Item({
  name: "Hit the + button to add a newitem"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
});

const defaultItems = [item1, item2, item3];


const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

// ------------------ Prepare Database for the Web App⏫ ------------------



// -------------------- Deal with the connections of URL with the server⏬ --------------------
app.get("/", function(req, res) {

  // Find and write all of the items in ItemDB
  Item.find({})
  .then(function(foundItem)  {
    if (foundItem.length === 0) {
      Item.insertMany(defaultItems);
      console.log("Successfully saved defult items to DB");
      res.redirect("/")
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItem});
    }
  })
  .catch(function(err){
    console.log(err);
  });
});

app.get("/:customListItem", function(req, res){
  const customListName = _.capitalize(req.params.customListItem);

  List.findOne({name: customListName})
  .then(function(foundItem){
    if (foundItem === null){
      const list = new List({
        name: customListName,
        items: defaultItems
      });
      console.log("Successfully added the new list to DB");
      list.save();
      res.redirect("/" + customListName)
    } else if (foundItem.name === customListName){
      console.log("The item called '" + foundItem.name + "' is already existed...");
      res.render("list", {listTitle: foundItem.name, newListItems: foundItem.items})
    };
  })
  .catch(function(err){
    console.log(err);
  });
});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list.trim();

  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");
  }else {
    List.findOne({name: listName})
    .then(function(foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
    .catch(function(err){
      console.log(err);
    })
  };



});

app.post("/delete", function(req, res){
  const deletedId = req.body.checkbox.trim();
  const listName = req.body.listName.trim();

  if (listName === "Today"){
    Item.findByIdAndRemove(deletedId)
    .then(function(){
      console.log("Successfully deleted the item");
    })
    .catch(function(err){
      console.log(err);
    })
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: deletedId}}})
    .then(function(foundList){
      res.redirect("/" + listName);
    })
    .catch(function(err){
      console.log(err);
    })
  };
});


app.get("/about", function(req, res){
  res.render("about");
});
// -------------------- Deal with the connections of URL with the server⏫ --------------------




// -------------------- Open port 3000 to connect the server⏬ --------------------
app.listen(3000, function() {
  console.log("Server started on port 3000");
});