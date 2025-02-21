require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174','https://task-manger-cb5df.web.app']
}))
app.use(express.json())

const uri = process.env.DB_URL

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
        // await client.connect();
        const userCollection = client.db('taskManger').collection('users');
        const taskCollection = client.db('taskManger').collection('tasks');

        // user api
        app.get('/users', async (req, res) => {
            const result = await userCollection.find().toArray();
            res.send(result);
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email };
            const isExist = await userCollection.findOne(query);
            if (isExist) {
                return res.send({ message: 'user already exist' })
            };
            const result = await userCollection.insertOne(user);
            res.send(result);
        });

        // task api
        app.get('/tasks', async (req, res) => {
            const result = await taskCollection.find().toArray();
            res.send(result);
        })
        app.get('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await taskCollection.find(query);
            res.send(result);
        })

        app.post('/tasks', async (req, res) => {
            const tasks = req.body;
            const result = await taskCollection.insertOne(tasks);
            res.send(result);
        })

        app.put('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const task = req.body;
            if (!ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid Task ID" });
            }

            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    title: task.title,
                    description: task.description
                },
            };
            const result = await taskCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.put('/tasks/move/:id', async (req, res) => {
            const id = req.params.id;
            const updateInfo = req.body;
            if (!updateInfo.taskId || !updateInfo.fromCategory || !updateInfo.toCategory) {
                return res.status(400).json({ message: "Invalid request. Missing required fields." });
            }
            const query = { _id: new ObjectId(id) };
            const update = { $set: { category: updateInfo.toCategory } };

            const result = await taskCollection.updateOne(query, update);

            if (result.modifiedCount === 1) {
                res.json({ message: "Task moved successfully!" });
            } else {
                res.status(404).json({ message: "Task not found or already in the target category." });
            }
        });

        app.delete('/tasks/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const result = await taskCollection.deleteOne(query);
            res.send(result);
        });

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Task Manager Server running!')
})

app.listen(port, () => {
    console.log(`Task Manager listening on port ${port}`)
})