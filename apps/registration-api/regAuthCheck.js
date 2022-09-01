import fetch from 'node-fetch'
const authURL = process.env.authURL || 'https://auth.sagecontinuum.org'
const tokenInfoPassword = process.env.tokenInfoPassword

export default function regAuthCheck(req, res, next) {

  const authHeader = req.get('Authorization')

  if (!authHeader) {
    let message = 'No authorization header provided'
    console.log(message)
    return res.status(401).send({message})
  }

  const token = authHeader.split(' ')[1]

  if (!token) {
    let message = 'Authorization string format not valid'
    console.log(message)
    return res.status(401).send({message})
  }

  fetch(`${authURL}/token_info/`, {
    body: `token=${token}`,
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${tokenInfoPassword}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    method: 'POST',
  }).then(async data => {
    const {status} = data
    const obj = await data.json()
    if (status === 200) {
      req.username = obj.username
      next()
    } else {
      res.status(status).send(obj)
    }
  }).catch(err => {
    res.status(err.status).send(err.message)
  })

}