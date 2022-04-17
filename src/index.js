const express = require("express");
const { v4: uuidv4 } = require("uuid");
const port = 3333;

const app = express();
app.use(express.json())

const customers = [];

//Middleware 

function verifyIfExistsAccountCPF(request, response, next){
    const { cpf } = request.headers;

    const customer = customers.find(customer => customer.cpf === cpf);

    if( !customer ){
        return response.status(400).json({error: "Customer not found"});
    }

    request.customer = customer;
    return next();
}


/**
* @param {String} - cpf
* @param {number} - name
* @param {number} - uuid
*/
app.post("/account", (request, response) => {
    const {cpf, name} = request.body;

    const customerAlreadyExists = customers.some( (customer) => customer.cpf === cpf);

    if( customerAlreadyExists ){
        return response.status(400).json({error: "Customer already exists!"});
    }

    customers.push({
        cpf,
        name, 
        id: uuidv4(), 
        statment:[]
    });
    return response.status(201).send();
});


/**
* @returns {String} - 200 OK
* @returns {String} - 400 Customer not found
*/
app.get("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
   
    return response.status(200).json(customer.statment);
});

app.listen(port, () => console.log(`Running at: ${port}`))