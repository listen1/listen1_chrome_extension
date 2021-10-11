// import { pki } from 'node-forge';
const { pki } = require('node-forge');
// import fs from 'fs';
const fs = require('fs');
const keys = pki.rsa.generateKeyPair(2048);
const cert = pki.createCertificate();
cert.publicKey = keys.publicKey;
cert.serialNumber = '01';

cert.validity.notBefore = new Date();
cert.validity.notAfter = new Date();
cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
const attrs = [{
    name: 'commonName',
    value: 'local.local'
}, {
    name: 'countryName',
    value: 'CN'
}, {
    shortName: 'ST',
    value: 'Shanghai'
}, {
    name: 'localityName',
    value: 'Shanghai'
}, {
    name: 'organizationName',
    value: 'Test'
}, {
    shortName: 'OU',
    value: 'Test'
}]
cert.setSubject(attrs);
cert.setIssuer(attrs);
cert.setExtensions([{
    name: 'basicConstraints',
    cA: true
}, {
    name: 'keyUsage',
    keyCertSign: true,
    digitalSignature: true,
    nonRepudiation: true,
    keyEncipherment: true,
    dataEncipherment: true
}, {
    name: 'extKeyUsage',
    serverAuth: true,
    clientAuth: true,
    codeSigning: true,
    emailProtection: true,
    timeStamping: true
}, {
    name: 'nsCertType',
    client: true,
    server: true,
    email: true,
    objsign: true,
    sslCA: true,
    emailCA: true,
    objCA: true
}, {
    name: 'subjectAltName',
    altNames: [{
        value: 'localhost'
    }]
}, {
    name: 'subjectKeyIdentifier'
}]);

cert.sign(keys.privateKey);
const pem = pki.certificateToPem(cert);
const privateKey = pki.privateKeyToPem(keys.privateKey);
fs.rmdirSync('./cert', { recursive: true });
fs.mkdirSync('./cert');
fs.writeFileSync('./cert/localhost.key', privateKey);
fs.writeFileSync('./cert/localhost.pem', pem);
