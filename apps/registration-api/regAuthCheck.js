const fetch = require("node-fetch");
const url = 'https://auth.sagecontinuum.org/token_info/';
const tokenInfoPassword = process.env.tokenInfoPassword;

function regAuthCheck(req, res, next) {
  const token = req.get("Authorization").split(' ')[1];

  if(!token){
    res.sendStatus(401);
    return;
  }
  
  fetch(url, {
    body: `token=${token}`,
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${tokenInfoPassword}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  })
  .then(async data => {
    const {status} = data;
    if (status === '200') {
      next();
    } else {
      const obj = await data.json();
      res.status(status).send(obj);
    }
    
  }).catch(err => {res.status(err.status).send(err.message)});

}
module.exports = { regAuthCheck };