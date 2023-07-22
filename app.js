//jshint esversion:6
require('dotenv').config();

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
// const date = require(__dirname + "/date.js");

const app = express();
app.set('view engine', 'ejs');
const PORT = process.env.PORT || 3000;

mongoose.set('strictQuery',false);

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
// connect to mongo database

// mongoose.connect("mongodb://0.0.0.0:27017/todolistDB",{useNewUrlParser: true});
// Use the above method to connect locally but , if we want to deploy the app we use mongo  atlas and update the code like below:
// mongoose.connect("mongodb+srv://hbapatla:Test123@cluster0.v0lpxem.mongodb.net/Cluster0?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true });



async function connectToDatabase() {
  const dbUri = process.env.Mongo_URI;
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };
try{
  const db = await mongoose.connect(dbUri, options);
  console.log('Connected to the database!');
  return db;
}catch(error){
  console.log("Error connecting the database",error);
}}

// Call the async function to establish the database connection
connectToDatabase()
  .then(() => {
    // Perform any further operations that depend on the database connection
    console.log("App is working");
  })
  .catch((error) => {
    console.error('Error connecting to the database:', error);
  });


const itemsSchema = {
  name :String

};
// creating a model for the schema that is usually capitalized
const Item = mongoose.model("Item",itemsSchema);

const item1 =new Item({
  name : "Welcome to your todolist"
});
const item2= new Item({
  name: "Hit the + button to add a new item."
});
const item3= new Item({
  name: " <-- Hit this to delete an item."
});

const defaultItems =[item1,item2,item3];

const listSchema ={
  name: String,
  items:[itemsSchema]
};
const List =mongoose.model("List",listSchema);


  // we use async function in the app.get below to use with await

// finding the documents using find in mongoose model using mongoose find() that uses await to send it over to list to render into the page.
// await is only valid in async functions and top level bodies of modules.

app.get("/", async (req, res) => {
  try {
    const foundItems = await Item.find({});

    if (foundItems.length === 0) {
      await Item.insertMany(defaultItems);
      console.log("Successfully saved default items to DB");
      //use res.redirect to go back to the root route and check if the default items are in the listt.
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  } catch (err) {
    console.log(err);
    res.status(500).send("Internal Server Error");
  }
});

// If a user wants to add an item to the todolist then we have to set our post route
app.post("/",async function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });
  if(listName =="Today"){
    item.save();
      //after an item is enterer by an user we redirect to home route.

    res.redirect("/");
  }else{
    // .exec( ) use when you have conditions in your search. Stands for excution()
   await List.findOne({name:listName}).maxTimeMS(30000).exec().then(foundList =>{
    foundList.items.push(item);
    foundList.save();
    res.redirect("/"+listName)
   }).catch(err => {
    console.log(err);
   });
  }
})

 
 
app.post("/delete",function(req,res){
  const checkedItemId = req.body.checkbox;
  const listName =req.body.listName;
  if(listName==="Today"){
Item.findByIdAndRemove(checkedItemId)
  .then(()=>{
    console.log("Item deleted successfully");
  })
  .catch((err)=>{
    console.log(err);
  });
  res.redirect("/");
}else{

  List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}})
  .then(()=>{
    res.redirect("/"+ listName);
  })
  .catch((err)=>{
    console.log(err);
  })
}
});
  


app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  const foundList = await List.findOne({ name: customListName });
 
  if (!foundList) {
    const list = new List({
      name: customListName,
      items: defaultItems,
    });
    await list.save();
    res.redirect("/" + customListName);
  } else {
    res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
  }
});

  

app.get("/about", function(req, res){
  res.render("about");
});

app.listen(PORT, function() {
    console.log("Server started successfully");
  });
