type Data = {
  uri: string
}

export default async function handler(req, res) {
  const next = require('next');

  // Now you can use the types like this:
  let req = next.NextApiRequest;
  let res = next.NextApiResponse;
  
  const Arweave = require('arweave');
  const { JWKInterface } = require('arweave/node/lib/wallet');

  // #1 Get the data from the POST request; encoded as base64 string. 
  const b64string = req.body.b64string
  const buf = Buffer.from(b64string, 'base64');

  // #2 Make a connection to Arweave server; following standard example. 
  const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
  });
  
  // #3 Load our key from the .env file
  const arweaveKey = process.env.ARWEAVE_KEY;

  // #4 Check out wallet balance. We should probably fail if too low? 
  const arweaveWallet = await arweave.wallets.jwkToAddress(arweaveKey);
  const arweaveWalletBallance = await arweave.wallets.getBalance(arweaveWallet);

  // #5 Core flow: create a transaction, upload and wait for the status! 
  let transaction = await arweave.createTransaction({data: buf}, arweaveKey);
  transaction.addTag('Content-Type', 'image/png');
  await arweave.transactions.sign(transaction, arweaveKey);
  const response = await arweave.transactions.post(transaction);
  const status = await arweave.transactions.getStatus(transaction.id)
  console.log(`Completed transaction ${transaction.id} with status code ${status}!`)

  // #6 This is the tricky part, use the format below to get to the PNG url! 
  res.status(200).json({ 
    uri: `https://www.arweave.net/${transaction.id}?ext=png` 
  })
}

const upload = async () => {
  // #1 Get base64 encoded PNG; make sure it's not prepended with data:image/png;base64, that's for browsers! 
  const b64string = "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"
  
  // #2 Make a post request to our API. Obviously, update the URL to your own deployment. 
  const response = await fetch("/api/upload-nft-png", {
    method: 'POST',
    body: JSON.stringify({
      b64string: b64string,
    }),
    headers: {
      'Content-Type': 'application/json'
    },
  });
  
  // #3 Get our Arweave URL, that's it! 
  const uri = (await response.json()).uri
  console.log(uri)
}