import express, { urlencoded, json } from "express";
const app = express();
import Big from "big.js";

app.use(urlencoded({ extended: true }));
app.use(json());

app.post("/calculate", function (req, res) {
  let valid = checkValidRequest(req, res);
  if (valid) {
    const type = mapType(req.body.type);
    const result = getResult(type, req.body.operation, req.body.values);
    if (result !== "false") {
      res.status(200).json({ result: result });
    } else {
      res.status(400).json({ error: "Cannot divide by 0" });
    }
  }
});

const checkValidRequest = (req, res) => {
  if (req.body.values && req.body.type && req.body.operation) {
    let numsArray = req.body.values;
    if (Array.isArray(req.body.values)) {
      if (req.body.values.length > 1) {
        if (req.body.type === "integer") {
          let isInteger = true;
          let index = [];
          numsArray.forEach((element, i) => {
            if (!Number.isInteger(element)) {
              isInteger = false;
              index.push(i);
            }
          });
          if (!isInteger) {
            res
              .status(400)
              .json({ error: `Non integer value provided at index: ${index}` });
          }
          index = [];
          return isInteger;
        } else if (req.body.type === "decimal") {
          let isDecimal = true;
          let index = [];
          numsArray.forEach((element, i) => {
            if (Number.isInteger(element)) {
              isDecimal = false;
              index.push(i);
            }
          });
          if (!isDecimal) {
            res
              .status(400)
              .json({ error: `Non decimal value provided at index: ${index}` });
          }

          index = [];
          return isDecimal;
        } else if (req.body.type === "safe") {
          let isSafe = true;
          numsArray.forEach((element) => {
            if (element !== 0) {
              if (element > 0) {
                if (element < Number.MAX_SAFE_INTEGER) {
                  isSafe = false;
                }
              } else {
                if (element > Number.MIN_SAFE_INTEGER) {
                  isSafe = false;
                }
              }
            }
          });
          if (isSafe === false) {
            res.status(400).json({ error: "Number Not Big Enough!" });
          }
          return isSafe;
        } else {
          res.status(400).json({ error: "Unknown type provided" });
          return false;
        }
      } else {
        res.status(400).json({ error: "Cannot operate on 1 value" });
        return false;
      }
    } else {
      res.status(400).json({ error: "Values not defined properly" });
      return false;
    }
  } else {
    res.status(400).json({ error: "Something broke!" });
    return false;
  }
};

function mapType(type) {
  if (type === "integer" || type === "decimal") {
    return "Number";
  } else return "Big";
}

function getResult(type, operation, array) {
  let res = 0;
  for (let index = 0; index <= array.length - 1; index++) {
    const element = array[index];
    let temp = validDenominator(operation, index, element);
    if (temp) {
      if (index === 0) {
        res = element;
      } else {
        if (type === "Number") {
          res = doNumberOperation(operation, res, element);
        }
        if (type === "Big") {
          res = doSafeOperation(operation, res, element);
        }
      }
    } else {
      res = "false";
      break;
    }
  }
  return res;
}

function doNumberOperation(operation, firstNum, secondNum) {
  let result = 0;
  if (operation == "add") {
    result = firstNum + secondNum;
  }
  if (operation == "sub") {
    result = firstNum - secondNum;
  }
  if (operation == "mul") {
    result = firstNum * secondNum;
  }
  if (operation == "div") {
    if (secondNum !== 0) {
      result = firstNum / secondNum;
    } else {
      throw "Error: Divide by 0";
    }
  }
  return result;
}

function doSafeOperation(operation, firstNum, secondNum) {
  let result = 0;
  let num1 = Big(firstNum);
  let num2 = Big(secondNum);
  if (operation == "add") {
    result = num1.plus(num2);
  }
  if (operation == "sub") {
    result = num1.minus(num2);
  }
  if (operation == "mul") {
    result = num1.times(num2);
  }
  if (operation == "div") {
    if (secondNum !== 0) {
      result = num1.div(num2);
    } else {
      throw "Error: Divide by 0";
    }
  }
  return result;
}

function validDenominator(operation, index, element) {
  let isValid = true;
  if (operation === "div" && index >= 1) {
    if (element === 0) {
      isValid = false;
    }
  }
  return isValid;
}

const port = 3000;
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
