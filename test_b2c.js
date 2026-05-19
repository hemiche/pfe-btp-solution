const http = require('http');

const options = {
    hostname: 'localhost',
    port: 4004,
    path: '/odata/v4/admin/Inscriptions?$filter=email eq \'b2ctest@example.com\'',
    method: 'GET',
    headers: {
        'Cookie': 'pfe_user=admin%40pfe.dz; pfe_role=Admin'
    }
};

const req = http.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Data:', JSON.parse(data).value[0]));
});

req.on('error', e => console.error('Error:', e));
req.end();
