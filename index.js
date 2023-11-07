const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// config
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.50udlth.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const foodsCollection = client.db("foodSurplusSaverA11").collection("foods");


    // =======foods========
    //  Create a new food item
    app.post("/foods", async (req, res) => {
      const food = req.body;
      // 'foodName', 'foodImgURL', 'quantity', 'location', 'expireDate', 'description', 'donatorName', 'donatorEmail', 'donatorImageURL', 'status'
      const newFood = {
        foodName: food.foodName || '',
        foodImgURL: food.foodImgURL || '',
        quantity: food.quantity || '',
        location: food.location || '',
        expireDate: food.expireDate || '',
        donatorName: food.donatorName || '',
        donatorImageURL: food.donatorImageURL || '',
        donatorEmail: food.donatorEmail || '',
        description: food.description || '',
        status: food.status || '',
        createdAt: new Date(),
      };

      try {
        const result = await foodsCollection.insertOne(newFood);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // get all foods items
    app.get("/foods", async (req, res) => {
      try {
        const cursor = foodsCollection.find({});
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // upadate a food item
    app.put("/foods/:id", async (req, res) => {
      const id = req.params.id;
      
      if (id.length < 24) {
        res.status(400).send("Invalid ID");
        return;
      }

      const updatedFood = req.body;
      try {
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            foodName: updatedFood.foodName,
            foodImgURL: updatedFood.foodImgURL,
            quantity: updatedFood.quantity,
            location: updatedFood.location,
            expireDate: updatedFood.expireDate,
            donatorName: updatedFood.donatorName,
            donatorImageURL: updatedFood.donatorImageURL,
            donatorEmail: updatedFood.donatorEmail,
            description: updatedFood.description,
            status: updatedFood.status,
          },
        };
        const result = await foodsCollection.updateOne(
          filter,
          updateDoc,
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });


    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("food-Surplus-Saver Confirmed!");
});

app.listen(port, () => {
  console.log(`food-Surplus-Saver listening at http://localhost:${port}`);
});
