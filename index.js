
const express = require('express')
const cors = require('cors');
const app = express()

const port = process.env.PORT || 5000;
require('dotenv').config()
var jwt = require('jsonwebtoken');

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);



app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials: true,

}))



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const EmployeeUnderHrCollection = client.db('Asset-Flow').collection('EmployeeUnderHr');
    const requestCollection = client.db('Asset-Flow').collection('RequestAssets');
    const noticetCollection = client.db('Asset-Flow').collection('Notices');

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


    app.put('/username-image-update', async (req, res) => {
      const user = req.body;
      const query = { email: user?.email };
      const doc = {
        $set: {
          ...user
        }
      }
      const result = await userCollection.updateOne(query, doc);
      res.send(result);
    })

    app.post('/hr', async (req, res) => {
      const user = req.body;
      const result = await hrCollection.insertOne(user);
      res.send(result);
    })

    app.get('/userRole/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      // console.log(email);
      const query = { email };
      const result = await userCollection.findOne(query);
      // console.log(result)
      res.send(result);
    })

    app.get('/assetsCount/:email', async (req, res) => {
      const email = req.params.email;
      const { search, returnOrNot, sortData, available } = req.query;

      const query = {};
      if (email) {
        query.email = email;
      }
      if (search) {

        query.ProductName = new RegExp(search, 'i');
      }
      if (returnOrNot) {
        query.ProductType = returnOrNot;
      }
      if (available) {
        if (available === 'available') {
          query.Quantity = { $gt: 0 }
        }
        else {
          query.Quantity = { $lt: 1 }
        }
      }
      const options = {
        sort: {
          Quantity: sortData === 'asc' ? 1 : -1
        }
      }
      try {

        const result = await assetsCollection.countDocuments(query, options);

        res.send({ count: result });
      } catch (error) {
        res.status(500).send('Error getting document count');
      }
    })

    //request count

    app.get('/all-requested-asset-count/:email', async (req, res) => {
      const email = req.params.email;
      const { search } = req.query;

      const query = {};
      if (email) {
        query.HrEmail = email;
      }
      // if (search) {

      //   query.ProductName = new RegExp(search, 'i');
      // }
      if (search) {
        query.$or = [
          { RName: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
        ]
      }
      query.Request = 'pending'


      try {

        const result = await requestCollection.countDocuments(query);

        res.send({ count: result });
      } catch (error) {
        res.status(500).send('Error getting document count');
      }
    })

    //employee
    app.get('/assetsCountForEmployee/:email', async (req, res) => {
      const email = req.params.email;
      const hr = await userCollection.findOne({ email });
      // console.log(hr.HRemail)
      const { search, returnOrNot, sortData, available } = req.query;

      const query = {};
      if (hr?.HR) {
        query.email = hr?.HR
      }
      if (search) {

        query.ProductName = new RegExp(search, 'i');
      }
      if (returnOrNot) {
        query.ProductType = returnOrNot;
      }
      if (available) {
        if (available === 'available') {
          query.Quantity = { $gt: 0 }
        }
        else {
          query.Quantity = { $lt: 1 }
        }
      }
      const options = {
        sort: {
          Quantity: sortData === 'asc' ? 1 : -1
        }
      }
      try {

        const result = await assetsCollection.countDocuments(query, options);

        res.send({ count: result });
      } catch (error) {
        res.status(500).send('Error getting document count');
      }
    })

    app.get('/my-all-requested-assets-count/:email', async (req, res) => {
      const email = req.params.email;
      // console.log('email = ', email)
      const { search, returnOrNot, sortData, available } = req.query;

      const query = {};
      if (email) {
        query.email = email;
      }
      if (search) {

        query.ProductName = new RegExp(search, 'i');
      }
      if (returnOrNot) {
        query.ProductType = returnOrNot;
      }
      if (available) {
        query.Request = available;
        // if (available === 'available') {
        //   query.Quantity = { $gt: 0 }
        // }
        // else {
        //   query.Quantity = { $lt: 1 }
        // }
      }
      const options = {
        sort: {
          Quantity: sortData === 'asc' ? 1 : -1
        }
      }
      try {

        const result = await requestCollection.countDocuments(query, options);

        res.send({ count: result });
      } catch (error) {
        res.status(500).send('Error getting document count');
      }
    })

    app.post('/asset', async (req, res) => {
      const product = req.body;
      const result = await assetsCollection.insertOne(product);
      res.send(result);
    })

    app.get('/assets/:email', async (req, res) => {
      const email = req.params.email;
      const { search, returnOrNot, sortData, available, limit = 10, page = 1 } = req.query;
      const skip = (page - 1) * limit;
      const query = {};

      if (email) {
        query.email = email
      }

      if (search) {
        query.ProductName = new RegExp(search, 'i');
      }
      if (returnOrNot) {
        query.ProductType = returnOrNot;
      }
      if (available) {
        if (available === 'available') {
          query.Quantity = { $gt: 0 }
        }
        else {
          query.Quantity = { $lt: 1 }
        }
      }
      const options = {
        sort: {
          Quantity: sortData === 'asc' ? 1 : -1
        }
      }




      const result = await assetsCollection.find(query, options).skip(Number(skip)).limit(Number(limit)).toArray();
      res.send(result);
    })

    //hr all asset request
    app.get('/all-asset-request/:email', async (req, res) => {
      const email = req.params.email;
      const { search, limit = 10, page = 1 } = req.query;
      const skip = (page - 1) * limit;
      const query = {};

      if (email) {
        query.HrEmail = email
      }
      // console.log(search)



      // if (search) {
      //   query.RName= new RegExp(search, 'i') 

      // }
      if (search) {
        query.$or = [
          { RName: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
        ]
      }
      query.Request = 'pending'
      // console.log(query)

      const result = await requestCollection.find(query).skip(Number(skip)).limit(Number(limit)).toArray();
      // console.log(result)
      res.send(result);
    })

    //employee


    //payment intend
    app.post("/create-payment-intent", verifyToken, async (req, res) => {
      const price = req.body.price;
      const priceInCent = parseFloat(price) * 100;
      console.log(priceInCent)

      if (!price || priceInCent < 1) return;


      const paymentIntent = await stripe.paymentIntents.create({
        amount: priceInCent,
        currency: "usd",

        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });



    app.get('/assetsForEmployee/:email', async (req, res) => {
      const email = req.params.email;

      //TODO
      const hr = await userCollection.findOne({ email });
      // console.log(hr.HRemail)

      const { search, returnOrNot, sortData, available, limit = 10, page = 1 } = req.query;
      const skip = (page - 1) * limit;
      const query = {};

      if (hr?.HR) {
        query.email = hr.HR
      }

      if (search) {
        query.ProductName = new RegExp(search, 'i');
      }
      if (returnOrNot) {
        query.ProductType = returnOrNot;
      }
      if (available) {
        if (available === 'available') {
          query.Quantity = { $gt: 0 }
        }
        else {
          query.Quantity = { $lt: 1 }
        }
      }
      const options = {
        sort: {
          Quantity: sortData === 'asc' ? 1 : -1
        }
      }

      const result = await assetsCollection.find(query, options).skip(Number(skip)).limit(Number(limit)).toArray();
      res.send(result);
    })

    app.get('/my-all-requested-assets/:email', async (req, res) => {
      const email = req.params.email;




      const { search, returnOrNot, sortData, available, limit = 10, page = 1 } = req.query;
      const skip = (page - 1) * limit;
      const query = {};

      // console.log(available)

      if (email) {
        query.email = email
      }

      if (search) {
        query.ProductName = new RegExp(search, 'i');
      }
      if (returnOrNot) {
        query.ProductType = returnOrNot;
      }
      if (available) {
        query.Request = available;
        // if (available === 'available') {
        //   query.Quantity = { $gt: 0 }
        // }
        // else {
        //   query.Quantity = { $lt: 1 }
        // }
      }
      const options = {
        sort: {
          Quantity: sortData === 'asc' ? 1 : -1
        }
      }

      const result = await requestCollection.find(query, options).skip(Number(skip)).limit(Number(limit)).toArray();
      res.send(result);
    })

    app.delete('/assetDelete/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assetsCollection.deleteOne(query);
      res.send(result);
    })

    app.get('/asset/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await assetsCollection.findOne(query);
      res.send(result);
    })

    app.patch('/update-asset/:id', async (req, res) => {
      const id = req.params.id;
      const assetInfo = req.body;
      const filter = { _id: new ObjectId(id) };
      const doc = {
        $set: {
          ProductName: assetInfo?.ProductName,
          ProductType: assetInfo?.ProductType,
          Quantity: assetInfo?.Quantity
        }
      }
      const result = await assetsCollection.updateOne(filter, doc);
      res.send(result)

    })

    app.post('/asset-request', async (req, res) => {
      const reqInfo = req.body;

      const result = await requestCollection.insertOne(reqInfo);
      res.send(result)
    })

    app.get('/my-pending-request/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email, Request: 'pending' };
      const result = await requestCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/monthly-request/:email', async (req, res) => {
      const email = req.params.email;
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59, 999);
      // console.log(startOfMonth, endOfMonth)
      const query = {
        email,
        RequestDate: {
          $gte: startOfMonth.toISOString(),
          $lte: endOfMonth.toISOString(),
        },
      };
      const result = await requestCollection.find(query).toArray();
      res.send(result);
    })

    app.get('/hr-info/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await requestCollection.findOne(query);
      // console.log(result.HrEmail);
      const filter = { email: result?.HrEmail };
      const hr = await hrCollection.findOne(filter);
      // console.log(hr)
      res.send(hr);
    })

    //asset count decrease for hr
    app.patch('/approval-decrease/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const doc = {
        $inc: { Quantity: -1 }
      }

      const result = await assetsCollection.updateOne(query, doc);
      // console.log(result)
      res.send(result);
    })

    //status update of an pending request HR
    app.patch('/status-update/:id', async (req, res) => {
      const id = req.params.id;
      // console.log(id)
      const query = { _id: new ObjectId(id) };
      const doc = {
        $set: {
          Request: 'approve',
          ApprovalDate: new Date()
        }
      }

      const result = await requestCollection.updateOne(query, doc);
      res.send(result);
    })

    //reject asset HR 
    app.delete('/reject-asset/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await requestCollection.deleteOne(query);
      res.send(result);
    })

    //increase request for employee
    app.patch('/increase-request/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const doc = {
        $inc: {
          RequestCount: 1
        }
      }
      const result = await assetsCollection.updateOne(query, doc);
      res.send(result);
    })

    //top 4 requested item for hr
    app.get('/top-four-requested-items/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      // console.log(email)
      const result = await assetsCollection.find(query).sort({ RequestCount: -1 }).limit(4).toArray();
      res.send(result)
    })

    //five pending request for hr
    app.get('/five-pending-request/:email', async (req, res) => {
      const email = req.params.email;
      const query = { HrEmail: email };
      // console.log(email)
      const result = await requestCollection.find(query).limit(5).toArray();
      res.send(result)
    })

    //limited stocks item for hr
    app.get('/limited-stocks/:email', async (req, res) => {
      const email = req.params.email;
      const query = {
        email: email,
        Quantity: { $lt: 10 }
      };
      // console.log(query)
      // console.log(email)
      const result = await assetsCollection.find(query).toArray();
      res.send(result)
    })

    //chart returnable items
    app.get('/returnable/:email', async (req, res) => {
      const email = req.params.email;
      const query = {
        HrEmail: email,
        ProductType: 'returnable'
      };
      // console.log(query)
      const result = await requestCollection.countDocuments(query);

      res.send({ count: result })
    })

    //nonreturnabel
    app.get('/non-returnable/:email', async (req, res) => {
      const email = req.params.email;
      const query = {
        HrEmail: email,
        ProductType: 'non-returnable'
      };
      const result = await requestCollection.countDocuments(query);
      res.send({ count: result })
    })

    //pending to be employee under an HR
    app.get('/pending-employee', async (req, res) => {
      const { page = 1, limit = 10 } = req.query;
      console.log(page, limit);
      const skip = (page - 1) * limit;
      const query = {
        status: 'pending',
        role: 'employee'
      }
      const result = await userCollection.find(query).skip(Number(skip)).limit(Number(limit)).toArray();
      res.send(result)
    })

    //package limit
    app.get('/package-limit/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await userCollection.findOne(query);
      res.send(result);
    })


    //add selected employee under a hr
    app.put('/add-selected-employee/:email', async (req, res) => {
      const email = req.params.email;

      const { selectedEmployee: employeeList, newLimit } = req.body;
      // const employeeList = ['hello@gmail.com', 'iam@gmail.com'];
      console.log(employeeList, newLimit)
      const query = { HRemail: email };

      const options = { upsert: true }
      // console.log(query)
      const doc = {
        $push:
        {
          MyTeam: { $each: employeeList }
        }
      }
      const result1 = await EmployeeUnderHrCollection.updateOne(query, doc, options);

      //now update all the employe status
      const HrInfo = await EmployeeUnderHrCollection.findOne({ HRemail: email });
      const employeeEmails = HrInfo?.MyTeam;
      const result2 = await userCollection.updateMany(
        { email: { $in: employeeEmails }, status: 'pending' },
        { $set: { status: 'verified', HR: email } }
      )

      //now update the hr limit
      const updateDoc = {
        $set: {
          employeeLimit: newLimit
        }
      }

      const result3 = await userCollection.updateOne({ email }, updateDoc);

      res.send(result3);


    })

    //add an employee
    app.put('/add-an-employee/:email', async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      // console.log(email);
      // console.log(user)
      const query = { HRemail: email };

      const options = { upsert: true }
      const doc = {
        $push:
        {
          MyTeam: user?.email
        }
      }

      const result = await EmployeeUnderHrCollection.updateOne(query, doc, options);


      const HrInfo = await EmployeeUnderHrCollection.findOne({ HRemail: email });
      const employeeEmails = HrInfo?.MyTeam;
      const result2 = await userCollection.updateMany(
        { email: { $in: employeeEmails }, status: 'pending' },
        { $set: { status: 'verified', HR: email } }
      )

      //now update the hr limit
      const updateDoc = {
        $inc: { employeeLimit: -1 }
      }

      const result3 = await userCollection.updateOne({ email }, updateDoc);

      res.send(result3);
    })

    //employee count under an hr
    app.get('/employee-under-hr/:email', async (req, res) => {
      const email = req.params.email;
      const query = { HRemail: email };
      const result = await EmployeeUnderHrCollection.findOne(query);
      res.send(result);
    })

    //pendingemployee count 
    app.get('/pending-employee-count', async (req, res) => {
      const query = { status: 'pending', role: 'employee' }
      const result = await userCollection.countDocuments(query);
      res.send({ count: result })
    })

    //my-employee-list
    app.get('/my-employee-list/:email', async (req, res) => {
      const email = req.params.email;
      const { page = 1, limit = 10 } = req.query;
      // console.log(page, limit);
      const skip = (page - 1) * limit;
      // console.log(email)

      // const result = await EmployeeUnderHrCollection.findOne({HRemail:email});
      // res.send(result)


      const HrInfo = await EmployeeUnderHrCollection.findOne({ HRemail: email });
      const employeeEmails = HrInfo?.MyTeam;

      const result2 = await userCollection.find(
        { email: { $in: employeeEmails } },
      ).skip(Number(skip)).limit(Number(limit)).toArray();

      res.send(result2)


    })

    //my employee count
    app.get('/my-employee-count/:email', async (req, res) => {
      const email = req.params.email;
      const result = await EmployeeUnderHrCollection.findOne({ HRemail: email });
      res.send(result)
    })

    //delete from my team
    app.put('/remove-from-team/:email', async (req, res) => {
      const email = req.params.email;
      const { userEmail } = req.body;
      // console.log(email, userEmail);
      const result = await EmployeeUnderHrCollection.updateOne(
        { HRemail: email },
        { $pull: { MyTeam: userEmail } }
      )

      const result1 = await userCollection.updateOne(
        { email: userEmail },
        {
          $unset: { HR: '' },
          $set: { status: 'pending' }
        }
      )

      res.send(result)
    })

    //get-user-info
    app.get('/get-user-info/:email', async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });
      res.send(result)
    })

    //update profile
    app.put('/profile-update/:email', async (req, res) => {
      const email = req.params.email;
      const { name, image } = req.body;
      const query = { email };
      const doc = {
        $set: {
          name: name,
          image: image
        }
      }
      const result = await userCollection.updateOne(query, doc);
      res.send(result);
    })

    //myTeam members employee
    app.get('/my-team-members/:email', async (req, res) => {
      const email = req.params.email;
      const { page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
      const { HR } = await userCollection.findOne({ email });
      // console.log(HR);
      const result = await userCollection.find({ HR }).skip(Number(skip)).limit(Number(limit)).toArray();
      res.send(result)
    })

    //myTeam count
    app.get('/my-team-count/:email', async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email });
      const result = await EmployeeUnderHrCollection.findOne({ HRemail: user?.HR });
      res.send(result)
    })

    //notice employee
    app.get('/notice', async (req, res) => {
      const result = await noticetCollection.find().toArray();
      res.send(result);
    })

    //limit increase
    app.patch('/update-limit-count/:email', async (req, res) => {
      const email = req.params.email;
      const { incrementLimit } = req.body;
      const query = { email };
      const doc = {
        $inc: {
          employeeLimit: incrementLimit
        }
      }
      const result = await userCollection.updateOne(query, doc);
      res.send(result);
    })


    //hrinfo for an employee
    app.get('/hr-info-for-me/:email', async(req, res) => {
      const email = req.params.email;
      console.log(email)
      const hr = await userCollection.findOne({email});
      if(!hr?.HR) return;
      
      const result = await hrCollection.findOne({email : hr?.HR});
      res.send(result);
    })

    //hr-info
    app.get('/hr-information/:email', async(req, res) => {
      const email = req.params.email;
      
      const result = await hrCollection.findOne({email});
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