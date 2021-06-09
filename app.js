const express = require('express')
const app = express()

const professoresRouter = require('./professoresRouter');


app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Hello World!')
})
app.use('/professores', professoresRouter)

app.listen(4000, () => {
    console.log(`Example app listening at http://localhost:4000`)
})