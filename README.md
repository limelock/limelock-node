# limelock-node
[Limelock](https://limelock.io) library for Node JS

## Installation

```bash
npm i limelock
```

## Usage

```javascript
var Limelock = require('limelock');

(async () => {
  var limelock = new Limelock();

  // login
  await limelock.login('<email>', '<password>');

  // get account information
  console.log(await limelock.me());

  // put some data
  var data = `Hello world! The current time is ${new Date().toLocaleString()}`;
  var putRecord = await limelock.put(data, `${new Date().getTime()}.txt`);
  console.log(putRecord);

  // small delay to allow data to propagate through network
  await delay(1000);

  // get the data
  var getRecord = await limelock.get(putRecord.txId);
  console.log(getRecord);

  var result = Buffer.from(getRecord.data, 'hex').toString();
  console.log(result);
  console.log(data == result ? 'Data verified!' : 'Data error!');

})();

```
