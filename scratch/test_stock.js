const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 4004,
  path: "/odata/v4/crm/Products(ID='P001')?$select=stockLevel",
  method: 'GET',
  headers: {
    'Authorization': 'Basic ' + Buffer.from('alice:').toString('base64')
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('BODY:', data);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
