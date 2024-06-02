
const express = require('express')
const cors = require('cors');
const app = express()
const port = process.env.PORT || 5000;
require('dotenv').config()
var jwt = require('jsonwebtoken');



app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,

}))



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.insvee7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const verifyToken = (req, res, next) => {
  // console.log('inside = ', req.headers.authorization);
  if (!req.headers.authorization) {


    return res.status(401).send({ message: 'Forbidden-Access' })
  }
  const token = req.headers.authorization.split(' ')[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {

      return res.status(401).send({ message: 'Forbidden-Access' });
    }
    req.decoded = decoded;

    next();
  });

}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection

    const userCollection = client.db('Asset-Flow').collection('users');
    const hrCollection = client.db('Asset-Flow').collection('HR');
    const assetsCollection = client.db('Asset-Flow').collection('assets');

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '8h' });
      res.send({ token })
    })


    app.put('/user', async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };
      const findUser = await userCollection.findOne(query);
      if (findUser) return;
      // console.log(user)
      const result = await userCollection.insertOne(user);
      res.send(result);
    })
    app.post('/hr', async (req, res) => {
      const user = req.body;
      const result = await hrCollection.insertOne(user);
      res.send(result);
    })

    app.get('/user/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      // console.log(email);
      const query = { email };
      const result = await userCollection.findOne(query);
      // console.log(result)
      res.send(result);
    })

    app.post('/asset', async (req, res) => {
      const product = req.body;
      const result = await assetsCollection.insertOne(product);
      res.send(result);
    })

    app.get('/assets', async (req, res) => {
      const { search, returnOrNot, sortData } = req.query;
      const query = {};
      // console.log('sort=', sortData)

      if (search) {
        query.ProductName = new RegExp(search, 'i');
      }
      if (returnOrNot) {
        query.ProductType = returnOrNot;
      }
      const options = {
        sort : {
          Quantity : sortData === 'asc' ? 1 : -1
        }
      }
      



      const result = await assetsCollection.find(query, options).toArray();
      res.send(result);
    })


    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello World for your!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})