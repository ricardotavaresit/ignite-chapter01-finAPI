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


function getBalance(statement){

    const balance = statement.reduce((acc, operation) => {
        if( operation.type === "credit"){
            return acc + operation.amount;
        }else{
            return acc - operation.amount;
        }
    }, 0);
    
    return balance;
}

/**
* @returns {String} - 200 OK
* @returns {String} - 400 Customer not found
*/
app.get("/statement", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
   
    return response.status(200).json(customer.statement);
});

/**
* @returns {String} - 200 OK
* @returns {String} - 400 Customer not found
*/
app.get("/statement/date", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;
    const { date } = request.query;

    const dateFormat = new Date(date + " : 00:00");

    const statement = customer.statement.filter( (statement) => statement.create_at.toDateString() === new Date( dateFormat).toDateString() );

   
    return response.status(200).json(statement);
});


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
        statement:[]
    });
    return response.status(201).json(customers);
});

/**
 * 
 */
app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {

    const {description, amount } = request.body;

    const { customer } = request;

    const statementOperation = {
        description, 
        amount, 
        create_at: new Date(), 
        type: "credit"
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();
});


app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);

    if( balance < amount ){
        return response.status(400).json({error: "Insufficient funds."});
    } 

    const statementOperation = {
        amount, 
        create_at: new Date(), 
        type: "debit"
    };

    customer.statement.push(statementOperation);

    return response.status(201).send();
});


app.put("/account", verifyIfExistsAccountCPF, (request, response) => {
    const { name } = request.body;
    const { customer } = request;

    customer.name = name;

    return response.status(201).send();
});

app.get("/account", verifyIfExistsAccountCPF, (request, response) => {

    const { customer } = request;

    return response.status(200).json(customer);
});

app.delete("/account", verifyIfExistsAccountCPF, (request, response) => {

    const { customer } = request;

    const index = customers.findIndex( (cust) => cust.cpf === customer.cpf );
 
     customers.splice(index, 1);

    return response.status(200).json(customers);
});

app.get("/balance", verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request;

    const balance = getBalance(customer.statement);

    return response.status(200).json(balance);

});




app.listen(port, () => console.log(`Running at: ${port}`))