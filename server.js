const express = require('express');
const bodyParser = require('body-parser');
const knex = require('knex');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : '',
      database : 'smartbrain'
    }
  });

const app = express();
app.use(bodyParser.json());
app.use(cors());

const database = {
    users: [
        {
            id: '123',
            name: 'john',
            email: 'john@gmail.com',
            password: 'cookies',
            entries: 0,
            joined: new Date()
        },
        {
            id: '124',
            name: 'Sally',
            password: 'bananas',
            email: 'sally@gmail.com',
            entries: 0,
            joined: new Date()
        }
    ],
    login: [
        {
            id: '32',
            hash:'',
            email: 'john@gmail.com',

        },
        {
            id: '33',
            email: 'sally@gmail.com',
            hash:'',
        }
    ]
}

app.get('/', (req, res) => {
    res.send(database);
});

app.post('/signin', (req, res) => {
    db.select('email', 'hash').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
        if(isValid) {
            return db.select('*').from('users')
            .where('email', '=', req.body.email)
            .then(user => {
                res.json(user[0]);
            })
            .catch(err => res.status(400).json('Unable to get user'))
            
        } else {
            res.status(400).json('Wrong credentials')
        }
    })
    .catch(err => res.status(400).json('Wrong credentials'))
});

app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    var hash = bcrypt.hashSync(password);
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
           return trx('users')
            .returning('*')
            .insert({
                email: loginEmail[0],
                name: name,
                joined: new Date()
            }).then(user => {
                res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })

    .catch(err => res.status(400).json('Unable to register'));
    
})

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    db.select('*').from('users').where('id', id).
    then(user => {
        if(user.length){
            res.json(user[0])
        } else {
            res.status(404).json('No such user');
        } 
    })
    .catch(err => res.status(404).json('Error getting user'))
})

app.put('/image',(req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
    .increment('entries', 1).returning('entries')
    .then(entries => {
        res.json(entries[0]);
    })
    .catch(err => res.status(400).json("Unable to get entries."))
})

app.listen(3000, () => {
    console.log("App is running");
})


/* bcrypt.hash("bacon", null, null, function(err, hash) {
    // Store hash in your password DB.
});

// Load hash from your password DB.
bcrypt.compare("bacon", hash, function(err, res) {
    // res == true
});
bcrypt.compare("veggies", hash, function(err, res) {
    // res = false
}); */