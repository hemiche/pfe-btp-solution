const cds = require('@sap/cds')

module.exports = (srv) => {
  srv.on('READ', 'User', () => [
    { id: 'alice', roles: ['Admin'] },
    { id: 'bob', roles: ['User'] }
  ])
}
