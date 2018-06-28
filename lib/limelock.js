
const crypto = require('crypto');
const fs = require('fs');
const request = require('request');

class Limelock {

  /**
   * constructor - limelock constructor
   *
   * @param  {String} token (optional) authentication token
   */
  constructor (token) {
    if (token) this.token = token;
    //this.baseUrl = 'https://api.limelock.io';
    this.baseUrl = 'https://1utxgnx3k5.execute-api.us-east-1.amazonaws.com/dev';
  }

  /**
   * hash - obtain md5 hash of data
   *
   * @param  {type} data description
   * @return {type}      description
   */
  hash (data) {
    var md5 = crypto.createHash('md5');
    md5.update(data);
    return md5.digest('hex');
  }

  /**
   * hashFile - description
   *
   * @param  {type} path description
   * @return {type}      description
   */
  hashFile (path) {
    return new Promise((resolve,reject) => {
      var md5 = crypto.createHash('md5');
      var stream = fs.createReadStream(path);
      stream.on('data', data => {
        md5.update(data);
      });
      stream.on('error', err => {
        return reject(err);
      });
      stream.on('end', () => {
        return resolve(md5.digest('hex'));
      });
    });
  }

  /**
   * login - description
   *
   * @param  {String} email    the email of the account to log in with
   * @param  {String} password the password of the account to log in with
   * @return {Promise}       resolves with auth token
   */
  login(email, password) {
    return new Promise((resolve,reject) => {
      var options = {
        uri: `${this.baseUrl}/accounts/login`,
        method: 'POST',
        json: true,
        body: { email, password }
      };
      request(options, (err,res,body) => {
        if (err) return reject(err);
        if (res.statusCode == 200) {
          this.token = body.authToken;
          return resolve(body.authToken);
        }
        return reject(new Error(`Could not log in: ${body}`))
      });
    });
  }

  /**
   * register - description
   *
   * @param  {String} email    the email to register with
   * @param  {String} password the password to register with
   * @return {type}          description
   */
  register(email,password) {
    return new Promise((resolve,reject) => {
      var options = {
        uri: `${this.baseUrl}/accounts/register`,
        method: 'POST',
        json: true,
        body: { email, password }
      };
      request(options, (err,res,body) => {
        if (err) return reject(err);
        if (res.statusCode == 200) return resolve();
        return reject(new Error(`Could not register: ${body}`))
      });
    });
  }

  /**
   * me - get details for logged in account
   *
   * @return {Promise}  resolves with account information
   */
  me() {
    return new Promise((resolve,reject) => {
      var options = {
        uri: `${this.baseUrl}/accounts/me`,
        method: 'POST',
        json: true,
        body: { authToken: this.token }
      };
      request(options, (err,res,body) => {
        if (err) return reject(err);
        if (res.statusCode == 200) return resolve(body);
        return reject(new Error(`Could not get details: ${body}`))
      });
    })
  }

  /**
   * get - get file data from limelock
   *
   * @param  {String} txId the transaction ID of the file to fetch
   * @return {Promise}     resolves with file data
   */
  get(txId) {
      return new Promise((resolve,reject) => {
        var options = {
          uri: `${this.baseUrl}/data/get`,
          method: 'POST',
          json: true,
          body: {
            authToken: this.token,
            txId: txId
          }
        };
        request(options, (err,res,body) => {
          if (err) return reject(err);
          if (res.statusCode == 200) return resolve(body);
          console.log(body);
          return reject(new Error(`Could not get data: ${body}`))
        });
      })
  }

  /**
   * put - put data in limelock
   *
   * @param  {String} data string data to put in limelock
   * @return {Promise}     resolves with put result
   */
  put(data, name) {
      return new Promise((resolve,reject) => {
        var options = {
          uri: `${this.baseUrl}/data/put`,
          method: 'POST',
          json: true,
          body: {
            authToken: this.token,
            data: data,
            name: name,
            hash: this.hash(data)
          }
        };
        request(options, (err,res,body) => {
          if (err) return reject(err);
          if (res.statusCode == 200) return resolve(body);
          return reject(new Error(`Could not put data: ${body}`))
        });
      })
  }

  /**
   * download - downloads hex representation of file to limelock and saves it
   *
   * Note: does not work in browser
   *
   * @param  {String} txId     the transaction ID of the file to fetch
   * @param  {String} filename (optional) the name to save file to (defaults to original filename)
   * @return {Promise}         resolves with limelock record of file
   */
  download(txId, filename) {
    return new Promise((resolve,reject) => {
      if (process.browser) {
        return reject(new Error(`This function is not supported in browser`));
      }
      this.get(txId).then(record => {
        if (!record.integrity) return reject(new Error('Data integrity compromised!!!'));
        var buf = Buffer.from(record.data, 'hex');
        fs.writeFile(filename || record.filename, buf.toString(), 'hex', err => {
          if (err) return reject(err);
          resolve(record);
        });
      }).catch(reject);
    });
  }

  /**
   * upload - uploads hex representation of file to limelock
   *
   * Note: does not work in browser
   *
   * @param  {String} path     the path of the file to upload
   * @param  {String} filename the name of the file (defaults to file hash)
   * @return {Promise}         resolves with limelock upload record
   */
  upload(path, filename) {
    return new Promise((resolve,reject) => {
      if (process.browser) {
        return reject(new Error(`This function is not supported in browser`));
      }
      fs.readFile(path, async (err,data) => {
        if (err) return reject(err);
        var hash = this.hash(data.toString('hex'));
        console.log(hash);
        this.put(data.toString('hex'), filename || hash)
          .then(resolve).catch(reject);
      });
    });
  }

}

module.exports = Limelock;
