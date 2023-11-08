const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// config
require("dotenv").config();
const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:5173',
  ],
  credentials: true,
}));
app.use(cookieParser());


// middleware
const verfiyToken = (req, res, next) => {
  const token = req.cookies.token;
  console.log(token)
  if (!token) {
    return res.status(401).send('Access Denied');
  }

  jwt.verify(token, secretkey, (err, decode) => {
    if (err) {
      console.log(err)
      return res.status(401).send('Access Denied');
    }
    req.user = decode;
    next();
  })

}

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
    const foodRequestsCollection = client.db("foodSurplusSaverA11").collection("foodRequests");
    const myFoodRequestsCollection = client.db("foodSurplusSaverA11").collection("myFoodRequests");


    // Secure routes
    // auth
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.SECRET_KEY, { expiresIn: '1h' });

      res
        .cookie('token', token, { httpOnly: true, secure: false })
        .send({ success: true })
    })

    // =======foods========
    //  Create a new food item
    app.post("/foods", async (req, res) => {
      const food = req.body;
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
      const query = req.query;
      // console.log(query)
      try {

        if (query.email) {
          const cursor = foodsCollection.find({ donatorEmail: query.email });
          const result = await cursor.toArray();
          res.send(result);
          return;
        }

        const cursor = foodsCollection.find({});
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // get a single food item
    app.get("/foods/:id", async (req, res) => {
      const id = req.params.id;
      if (id.length < 24) {
        res.status(400).send("Invalid ID");
        return;
      }
      try {
        const query = { _id: new ObjectId(id) };
        const result = await foodsCollection.findOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // update a food item
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


    // update a food item with patch
    app.patch("/foods/:id", async (req, res) => {
      const id = req.params.id;
      console.log('patch1')
      if (id.length < 24) {
        res.status(400).send("Invalid ID");
        return;
      }

      const updatedFood = req.body;
      try {
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            // foodName: updatedFood.foodName,
            // foodImgURL: updatedFood.foodImgURL,
            // quantity: updatedFood.quantity,
            // location: updatedFood.location,
            // expireDate: updatedFood.expireDate,
            // donatorName: updatedFood.donatorName,
            // donatorImageURL: updatedFood.donatorImageURL,
            // donatorEmail: updatedFood.donatorEmail,
            // description: updatedFood.description,
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

    // Delete a single food item
    app.delete("/foods/:id", async (req, res) => {
      const id = req.params.id;
      if (id.length < 24) {
        res.status(400).send("Invalid ID");
        return;
      }
      try {
        const query = { _id: new ObjectId(id) };
        const result = await foodsCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // =====sort and Search food items==========

    app.get("/foods/sort/:sortMethod", async (req, res) => {
      const sortMethod = req.params.sortMethod;
      try {
        if (sortMethod === 'expireDate') {
          const cursor = foodsCollection.find({}).sort({ expireDate: 1 });
          const result = await cursor.toArray();
          res.send(result);
          return;
        }
        else {
          const cursor = foodsCollection.find({});
          const result = await cursor.toArray();
          res.send(result);
          return;
        }
      } catch (error) {
        res.status(500).send({ message: error.message });
      }

    });



    // =======foods Request========

    //  Create a new food request item
    app.post("/foodRequests", async (req, res) => {
      const foodRequest = req.body;
      // foodID,requestedDate,expireDate,requesterName,requesterImageURL,requesterEmail,requesterMessage,status
      if (foodRequest.foodID.length < 24) {
        res.status(400).send("Invalid ID");
        return;
      }

      const newFoodRequest = {
        foodID: new ObjectId(foodRequest.foodID) || '',
        requestedDate: new Date(),
        expireDate: foodRequest.expireDate || '',
        requesterName: foodRequest.requesterName || '',
        requesterImageURL: foodRequest.requesterImageURL || '',
        requesterEmail: foodRequest.requesterEmail || '',
        requesterMessage: foodRequest.requesterMessage || '',
        donationMoney: foodRequest.donationMoney || '',
        status: foodRequest.status || 'pending',
      };

      try {
        const result = await foodRequestsCollection.insertOne(newFoodRequest);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // get all foodRequests items
    app.get("/foodRequests", async (req, res) => {
      const query = req.query;
      try {
        if (query.id) {
          const cursor = foodRequestsCollection.find({ foodID: query.id });
          const result = await cursor.toArray();
          res.send(result);
          return;
        }
        else if (query.email) {
          const cursor = foodRequestsCollection.aggregate([
            {
              $lookup: {
                from: 'foods',
                localField: 'foodID', 
                foreignField: '_id',
                as: 'food'
              }
            }
          ])
          const result = await cursor.toArray();
          res.send(result);
          return;
        }
        else {
          res.status(400).send("Invalid query");
        }
        // const cursor = foodRequestsCollection.find({});
        // const result = await cursor.toArray();
        // res.send(result);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });

    // update a food request item
    app.patch("/foodRequests/:id", async (req, res) => {
      const id = req.params.id;
      console.log('patch5')
      if (id.length < 24) {
        res.status(400).send("Invalid ID");
        return;
      }

      const updatedFoodRequest = req.body;
      console.log(updatedFoodRequest)
      try {
        const filter = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            // foodID: updatedFoodRequest.foodID,
            // requestedDate: updatedFoodRequest.requestedDate,
            // expireDate: updatedFoodRequest.expireDate,
            // requesterName: updatedFoodRequest.requesterName,
            // requesterImageURL: updatedFoodRequest.requesterImageURL,
            // requesterEmail: updatedFoodRequest.requesterEmail,
            // requesterMessage: updatedFoodRequest.requesterMessage,
            status: updatedFoodRequest.status,
          },
        };
        const result = await foodRequestsCollection.updateOne(
          filter,
          updateDoc,
        );
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }

    })

    // Delete a single food request item
    app.delete("/foodRequests/:id", async (req, res) => {
      const id = req.params.id;
      if (id.length < 24) {
        res.status(400).send("Invalid ID");
        return;
      }
      try {
        const query = { _id: new ObjectId(id) };
        const result = await foodRequestsCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
     
    })



    // ========feature food item=========

    // get featured foods items
    app.get("/featuredFoods", async (req, res) => {
      try {
        const cursor = foodsCollection.find({}).limit(6).sort({ quantity: -1 });
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    });


    // ========my food requests=========

    // my food requests
    app.get("/myFoodRequests", async (req, res) => {
      const query = req.query;
      console.log(query)
      try {

        if (query.email) {
          const cursor = myFoodRequestsCollection.find({ requesterEmail: query.email });
          const result = await cursor.toArray();
          res.send(result);
          return;
        }

        const cursor = myFoodRequestsCollection.find({});
        const result = await cursor.toArray();
        res.send(result);
      } catch (error) {
        res.status(500).send({ message: error.message });
      }
    })

    // Create a new my food request item
    app.post("/myFoodRequests", async (req, res) => {
      const myFoodRequest = req.body;
      // foodID', 'foodName', 'foodImgURL', 'donatorName', 'donatorEmail', 'userEmail', 'requestedDate', 'location', 'expireDate', 'donationMoney', 'userMessge', 'userMessage
      const newMyFoodRequest = {
        foodID: myFoodRequest.foodID || '',
        foodName: myFoodRequest.foodName || '',
        foodImgURL: myFoodRequest.foodImgURL || '',
        donatorName: myFoodRequest.donatorName || '',
        donatorEmail: myFoodRequest.donatorEmail || '',
        userEmail: myFoodRequest.userEmail || '',
        requestedDate: new Date(),
        location: myFoodRequest.location || '',
        expireDate: myFoodRequest.expireDate || '',
        donationMoney: myFoodRequest.donationMoney || '',
        userMessage: myFoodRequest.userMessage || '',
      };

      try {
        const result = await myFoodRequestsCollection.insertOne(newMyFoodRequest);
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
