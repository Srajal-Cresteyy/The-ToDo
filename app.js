const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const _=require("lodash");

 
app.set('view engine', 'ejs');
 
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
 
mongoose.connect("mongodb://0.0.0.0:27017/todolistDB", {useNewUrlParser: true});
 
//Created Schema
const itemsSchema = new mongoose.Schema({
  name: String
});
 
//Created model
const Item = mongoose.model("Item", itemsSchema);
 
//Creating items
const item1 = new Item({
  name: "Welcome to your todo list."
});
 
const item2 = new Item({
  name: "Hit + button to create a new item."
});
 
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});
 
//Storing items into an array
const defaultItems = [item1, item2, item3];
 
//In latest version of mongoose insertMany has stopped accepting callbacks
//instead they use promises(Which Angela has not taught in this course)
//So ".then" & "catch" are part of PROMISES IN JAVASCRIPT.
//In JS, programmers encountered a problem called "callback hell", where syntax of callbacks were cumbersome & often lead to more problems.
//So in effort to make it easy PROMISES were invented.
//to learn more about promise visit : https://javascript.info/promise-basics
//Or https://www.youtube.com/watch?v=novBIqZh4Bk
const listSchema = new mongoose.Schema({
  name:String,
  items:[itemsSchema]
});

const List = mongoose.model("List",listSchema);

app.get("/", function(req, res) {
  
  Item.find({}).then(function(foundItems){
    if(foundItems.length === 0){
      Item.insertMany(defaultItems)
        .then(function(){
          console.log("Successfully saved into our DB.");
        })
        .catch(function(err){
          console.log(err);
        });
        res.redirect("/");
    }
    else{
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  })
  .catch(function(err){
    console.log(err);
  });
 
});

app.get("/:customListName",function(req,res){
  
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({name: customListName})
    .then(function(foundList){
      if(!foundList){
        // console.log("Doesn't Exist");
        const currlist = new List({
          name:customListName,
          items: defaultItems
        });
        currlist.save();
        res.redirect("/"+customListName);
      }
      else{
        // console.log("Exists!");
        res.render ("list",{listTitle:foundList.name,newListItems:foundList.items}); 
      }
    })
    .catch(function(err){});

});
 
app.post("/", function(req, res){
 
  const itemName = req.body.newItem;
  const listName = req.body.listName;

  let currItem=new Item({
    name:itemName
  });

  if(listName == "Today"){
    currItem.save();
    res.redirect("/");
  }
  else {
    List.findOne({name:listName})
      .then(function(foundList){
        foundList.items.push(currItem);
        foundList.save();
        res.redirect("/"+listName);
      })
      .catch(function(err){
        console.log(err);
      });
  }

  // currItem.save();

  // res.redirect("/");

});

app.post("/delete",function(req,res){
  const checkboxID = req.body.checkbox;
  const listName = req.body.listName;

  if(listName == "Today"){
  Item.findByIdAndRemove(checkboxID)
      .then(function(){
        console.log("Successfully Deleted the item !");
      })
      .catch(function(err){
        console.log(err);
      });
    res.redirect("/");
  }
  else{
    List.findOneAndUpdate(
      {name:listName},
      {$pull: 
        {items:{_id:checkboxID}}
      }
    )
    .then(function(foundList){
      res.redirect("/"+listName);
    })
    .catch(function(err){
      console.log(err);
    });
  }
  // console.log(req.body);
});
 

 
app.get("/about", function(req, res){
  res.render("about");
});
 
app.listen(3000, function() {
  console.log("Server started on port 3000");
});