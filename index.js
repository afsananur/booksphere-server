const express =require('express');

const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const port = process.env.PORT || 3000;

//midleware

app.use(cors());
app.use(express.json());
 
console.log(process.env.DB_USER)



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rtsqfuv.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
  

    const categoriesCollection = client.db("bookSphere").collection("categories");
    const allBooksCollection = client.db("bookSphere").collection("allbooks");

    const BorrowedCollection = client.db("bookSphere").collection("borrowing");

    app.get("/categories", async (req, res) => {
        const cursor = categoriesCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      })

    app.get("/allbooks", async (req, res) => {
        const cursor = allBooksCollection.find();
        const result = await cursor.toArray();
        res.send(result);
      })

      app.get('/allbooks/:category', async (req, res) => {
        const category = req.params.category
        const query = { category_name: category }

        const result = await allBooksCollection.find(query).toArray()
        res.send(result)
    })
    app.get('/allbooks/:category/:id', async (req, res) => {
        const id = req.params.id
        const category = req.params.category;
        console.log(id, category)
        const query = { _id: new ObjectId(id) }
        const result = await allBooksCollection.findOne(query)
        res.send(result)
    })


    app.post('/allBooks', async (req, res) => {
      const book = req.body;

      const result = await allBooksCollection.insertOne(book)
      res.send(result)
  })

  app.get('/borrowing', async (req, res) => {
    console.log(req.query.email);
     let query ={};
    if (req.query?.email) {
         query = { email: req.query.email }
        const result = await BorrowedCollection.find(query).toArray()
        res.send(result)
    }

})
  app.post('/borrowing', async (req, res) => {
    const borrowed = req.body;
    if (borrowed.book.quantity > 0) {

        const result = await BorrowedCollection.insertOne(borrowed)
        res.send(result)
    }
    else {
        res.send('No Book available')
    }
})



app.get('/borrowing/:id', async (req, res) => {
  const id = req.params.id
  const query = { _id: new ObjectId (id) }
  console.log(query)
  const result = await BorrowedCollection.findOne(query)
  res.send(result)
})

// update 
app.patch('/allBooks/:category/:id/:action', async (req, res) => {
  try {
      const id = req.params.id;
      const book = req.body;
      const action = req.params.action;
      const filter = { _id: new ObjectId(id) };
      console.log(book)
      let updatedDoc;

      if (action === 'borrow') {
          if (book.quantity > 0) {
              updatedDoc = {
                  $set: {
                      quantity: book.quantity - 1
                  }
              };
              const result = await allBooksCollection.updateOne(filter, updatedDoc);
              res.send(result);
          } else {
              throw new Error('Book quantity is not sufficient for borrowing.');
          }
      } else if (action === 'update') {
          updatedDoc = {
              $set: {
                  img:book.img,
                  books_name: book.books_name,
                  category_name: book.category_name,
                  author_name: book.author_name,
                  rating: book.rating,
                  quantity: book.quantity,
                  description: book.description
              }
          };
          const result = await allBooksCollection.updateOne(filter, updatedDoc);
          res.send(result);
      }
      else if (action === 'return') {
          updatedDoc = {
              $set: {
                  quantity: book.quantity + 1

              }
          }
          const result = await allBooksCollection.updateOne(filter, updatedDoc)
          res.send(result)
      } else {
          throw new Error('Invalid ');
      }


  } catch (error) {
      console.error('Error updating book:', error.message);
      res.status(500).send({ error: 'Internal Server Error' });
  }
});

// delete 

app.delete('/borrowing/:id', async (req, res) => {
  const id = req.params.id
  const query = { _id: new ObjectId(id) }
  console.log(query)
  const result = await BorrowedCollection.deleteOne(query)
  res.send(result)
})



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/' , (req, res) => {
    res.send('BookSphere running')
})


app.listen(port, () => {
   console.log(`BookSphere  IS RUNNUNG on port, ${port}`)
})