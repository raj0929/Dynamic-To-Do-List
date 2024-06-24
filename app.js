const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://testuser123:drnr35470@cluster0.admiwkf.mongodb.net/todolistDB");

const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name : String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", async function(req, res) {
  try {
    const foundItems = await Item.find({});

    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      console.log("Successfully saved default items to DB");
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.error(err);
    // Handle errors appropriately, e.g., send an error response to the client
    res.status(500).send("Internal Server Error");
  }
});

app.get("/:customListName", async function(req,res){
try{
  const customListName = _.capitalize (req.params.customListName);

const foundlist = await List.findOne({name: customListName});
    if(!foundlist){
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save();
      res.redirect("/" + customListName);
    }
    else{
      res.render("list", { listTitle: foundlist.name , newListItems: foundlist.items })
    }
}catch(err){
  console.error(err);
}
});

app.post("/", async function(req, res) {
  try {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({
      name: itemName
    });

    if (listName === "Today") {
      await item.save();
      res.redirect("/");
    } else {
      const foundList = await List.findOne({ name: listName });

      if (foundList) {
        foundList.items.push(item);
        await foundList.save();
        res.redirect("/" + listName);
      } else {
        // Handle the case where the list is not found
        res.status(404).send("List not found");
      }
    }
  } catch (err) {
    console.error(err);
    // Handle errors appropriately, e.g., send an error response to the client
    res.status(500).send("Internal Server Error");
  }
});


app.post("/delete", async function(req,res){
  try {
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
      await Item.findByIdAndDelete(checkedItemId);
          console.log("Successfully deleted checked item");
          res.redirect("/");
    }
    else{
      await List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}});
        res.redirect("/" + listName);
    }
  } catch (err) {
    console.error(err);
  }
});



app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
